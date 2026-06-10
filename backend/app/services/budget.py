from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetProgress, BudgetUpdate
from app.services.audit import write_audit


def _budget_to_dict(b: Budget) -> dict:
    return {
        "id": str(b.id),
        "category_id": str(b.category_id),
        "year_month": b.year_month,
        "amount": str(b.amount),
    }


class BudgetService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, user_id: uuid.UUID, year_month: str | None = None) -> list[Budget]:
        q = select(Budget).where(Budget.user_id == user_id)
        if year_month:
            q = q.where(Budget.year_month == year_month)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def get(self, user_id: uuid.UUID, budget_id: uuid.UUID) -> Budget:
        result = await self.db.execute(
            select(Budget).where(Budget.id == budget_id, Budget.user_id == user_id)
        )
        budget = result.scalar_one_or_none()
        if not budget:
            raise HTTPException(status_code=404, detail="Budget not found")
        return budget

    async def create(self, user_id: uuid.UUID, body: BudgetCreate) -> Budget:
        budget = Budget(user_id=user_id, **body.model_dump())
        self.db.add(budget)
        await self.db.flush()
        await write_audit(
            self.db,
            user_id=user_id,
            entity_type="budget",
            entity_id=budget.id,
            action="CREATE",
            after_data=_budget_to_dict(budget),
        )
        await self.db.commit()
        await self.db.refresh(budget)
        return budget

    async def update(self, user_id: uuid.UUID, budget_id: uuid.UUID, body: BudgetUpdate) -> Budget:
        budget = await self.get(user_id, budget_id)
        before = _budget_to_dict(budget)
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(budget, field, value)
        budget.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        await write_audit(
            self.db,
            user_id=user_id,
            entity_type="budget",
            entity_id=budget.id,
            action="UPDATE",
            before_data=before,
            after_data=_budget_to_dict(budget),
        )
        await self.db.commit()
        await self.db.refresh(budget)
        return budget

    async def delete(self, user_id: uuid.UUID, budget_id: uuid.UUID) -> None:
        budget = await self.get(user_id, budget_id)
        before = _budget_to_dict(budget)
        await write_audit(
            self.db,
            user_id=user_id,
            entity_type="budget",
            entity_id=budget.id,
            action="DELETE",
            before_data=before,
        )
        await self.db.delete(budget)
        await self.db.commit()

    async def get_progress(self, user_id: uuid.UUID, year_month: str) -> list[BudgetProgress]:
        budgets_result = await self.db.execute(
            select(Budget, Category)
            .join(Category, Budget.category_id == Category.id)
            .where(Budget.user_id == user_id, Budget.year_month == year_month)
        )
        rows = budgets_result.all()

        year, month = int(year_month[:4]), int(year_month[5:7])
        from calendar import monthrange
        _, last_day = monthrange(year, month)
        from datetime import date
        period_start = date(year, month, 1)
        period_end = date(year, month, last_day)

        spending_result = await self.db.execute(
            select(Transaction.category_id, func.sum(Transaction.amount * Transaction.exchange_rate))
            .where(
                Transaction.user_id == user_id,
                Transaction.type == "expense",
                Transaction.date >= period_start,
                Transaction.date <= period_end,
            )
            .group_by(Transaction.category_id)
        )
        spending_map: dict[uuid.UUID, Decimal] = {
            row[0]: row[1] for row in spending_result.all()
        }

        progress = []
        for budget, category in rows:
            spent = spending_map.get(budget.category_id, Decimal("0"))
            remaining = budget.amount - spent
            percent = (spent / budget.amount * 100) if budget.amount > 0 else Decimal("0")
            progress.append(
                BudgetProgress(
                    budget_id=budget.id,
                    category_id=budget.category_id,
                    category_name=category.name,
                    budget_amount=budget.amount,
                    spent_amount=spent,
                    remaining=remaining,
                    percent_used=percent,
                )
            )
        return progress
