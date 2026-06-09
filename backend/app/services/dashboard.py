import uuid
from calendar import monthrange
from datetime import date
from decimal import Decimal

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.dashboard import DashboardSummary, ExpenseByCategory, MonthlyTrend, TopCategory


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _month_range(self, year_month: str) -> tuple[date, date]:
        year, month = int(year_month[:4]), int(year_month[5:7])
        _, last_day = monthrange(year, month)
        return date(year, month, 1), date(year, month, last_day)

    async def summary(self, user_id: uuid.UUID, year_month: str) -> DashboardSummary:
        start, end = self._month_range(year_month)
        result = await self.db.execute(
            select(
                Transaction.type,
                func.sum(Transaction.amount * Transaction.exchange_rate),
            )
            .where(
                Transaction.user_id == user_id,
                Transaction.date >= start,
                Transaction.date <= end,
            )
            .group_by(Transaction.type)
        )
        totals: dict[str, Decimal] = {}
        for row in result.all():
            totals[row[0]] = row[1] or Decimal("0")

        income = totals.get("income", Decimal("0"))
        expense = totals.get("expense", Decimal("0"))
        return DashboardSummary(
            year_month=year_month,
            total_income=income,
            total_expense=expense,
            balance=income - expense,
        )

    async def expenses_by_category(self, user_id: uuid.UUID, year_month: str) -> list[ExpenseByCategory]:
        start, end = self._month_range(year_month)
        result = await self.db.execute(
            select(
                Category.id,
                Category.name,
                func.sum(Transaction.amount * Transaction.exchange_rate).label("total"),
            )
            .join(Transaction, Transaction.category_id == Category.id)
            .where(
                Transaction.user_id == user_id,
                Transaction.type == "expense",
                Transaction.date >= start,
                Transaction.date <= end,
            )
            .group_by(Category.id, Category.name)
            .order_by(text("total DESC"))
        )
        rows = result.all()
        grand_total = sum(r[2] for r in rows) or Decimal("1")
        return [
            ExpenseByCategory(
                category_id=r[0],
                category_name=r[1],
                amount=r[2],
                percent=r[2] / grand_total * 100,
            )
            for r in rows
        ]

    async def trend(self, user_id: uuid.UUID) -> list[MonthlyTrend]:
        result = await self.db.execute(
            select(
                func.to_char(Transaction.date, "YYYY-MM").label("month"),
                Transaction.type,
                func.sum(Transaction.amount * Transaction.exchange_rate).label("total"),
            )
            .where(
                Transaction.user_id == user_id,
                Transaction.date >= func.date_trunc("month", func.now() - text("interval '5 months'")),
            )
            .group_by(text("month"), Transaction.type)
            .order_by(text("month"))
        )
        rows = result.all()
        months: dict[str, dict] = {}
        for month, tx_type, total in rows:
            if month not in months:
                months[month] = {"income": Decimal("0"), "expense": Decimal("0")}
            months[month][tx_type] = total or Decimal("0")
        return [
            MonthlyTrend(month=m, income=v["income"], expense=v["expense"])
            for m, v in sorted(months.items())
        ]

    async def top_categories(self, user_id: uuid.UUID, year_month: str) -> list[TopCategory]:
        start, end = self._month_range(year_month)
        result = await self.db.execute(
            select(
                Category.id,
                Category.name,
                func.sum(Transaction.amount * Transaction.exchange_rate).label("total"),
            )
            .join(Transaction, Transaction.category_id == Category.id)
            .where(
                Transaction.user_id == user_id,
                Transaction.type == "expense",
                Transaction.date >= start,
                Transaction.date <= end,
            )
            .group_by(Category.id, Category.name)
            .order_by(text("total DESC"))
            .limit(5)
        )
        return [
            TopCategory(category_id=r[0], category_name=r[1], amount=r[2], rank=i + 1)
            for i, r in enumerate(result.all())
        ]
