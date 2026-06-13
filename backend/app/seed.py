"""Seed script: creates 2 users, 12 categories, 200+ transactions, 3 budgets, recurring rules."""
import asyncio
import random
import uuid
from datetime import date, timedelta
from decimal import Decimal

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.config import settings
from app.models.user import User
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.recurring_rule import RecurringRule
from app.models.exchange_rate import ExchangeRate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


USERS = [
    {"email": "personal@example.com", "password": "password123", "full_name": "Иван Личный", "base_currency": "RUB"},
    {"email": "family@example.com", "password": "password123", "full_name": "Семья Петровых", "base_currency": "RUB"},
]

CATEGORIES = [
    {"name": "Зарплата",         "icon": "money-bag",        "color": "#22c55e", "type": "income"},
    {"name": "Фриланс",          "icon": "laptop",           "color": "#10b981", "type": "income"},
    {"name": "Инвестиции",       "icon": "chart-increasing", "color": "#06b6d4", "type": "income"},
    {"name": "Продукты",         "icon": "shopping-cart",    "color": "#f59e0b", "type": "expense"},
    {"name": "Транспорт",        "icon": "automobile",       "color": "#6366f1", "type": "expense"},
    {"name": "Кафе и рестораны", "icon": "hot-beverage",     "color": "#ec4899", "type": "expense"},
    {"name": "ЖКХ",              "icon": "house",            "color": "#8b5cf6", "type": "expense"},
    {"name": "Связь",            "icon": "mobile-phone",     "color": "#14b8a6", "type": "expense"},
    {"name": "Развлечения",      "icon": "musical-notes",    "color": "#f43f5e", "type": "expense"},
    {"name": "Одежда",           "icon": "t-shirt",          "color": "#84cc16", "type": "expense"},
    {"name": "Здоровье",         "icon": "medical-symbol",   "color": "#ef4444", "type": "expense"},
    {"name": "Образование",      "icon": "graduation-cap",   "color": "#3b82f6", "type": "expense"},
]


async def seed():
    engine = create_async_engine(settings.database_url, echo=False)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    async with SessionLocal() as db:
        # Check if already seeded
        result = await db.execute(select(User).where(User.email == "personal@example.com"))
        if result.scalar_one_or_none():
            print("Already seeded, skipping.")
            return

        # Create users
        users: list[User] = []
        for u_data in USERS:
            user = User(
                email=u_data["email"],
                hashed_password=pwd_context.hash(u_data["password"]),
                full_name=u_data["full_name"],
                base_currency=u_data["base_currency"],
            )
            db.add(user)
            users.append(user)
        await db.flush()

        # Create categories for each user
        user_categories: dict[uuid.UUID, list[Category]] = {}
        for user in users:
            cats = []
            for c_data in CATEGORIES:
                cat = Category(user_id=user.id, **c_data)
                db.add(cat)
                cats.append(cat)
            user_categories[user.id] = cats
        await db.flush()

        # Exchange rates
        today = date.today()
        for delta in range(180):
            d = today - timedelta(days=delta)
            for base, target, rate in [
                ("RUB", "USD", Decimal("0.011")),
                ("RUB", "EUR", Decimal("0.010")),
                ("USD", "RUB", Decimal("90.5")),
                ("EUR", "RUB", Decimal("98.0")),
            ]:
                er = ExchangeRate(base_currency=base, target_currency=target, rate=rate, date=d)
                db.add(er)

        # Transactions: 200+ per user over 6 months
        rng = random.Random(42)
        for user in users:
            cats = user_categories[user.id]
            income_cats = [c for c in cats if c.type == "income"]
            expense_cats = [c for c in cats if c.type == "expense"]

            for day_offset in range(180):
                tx_date = today - timedelta(days=day_offset)

                # Monthly salary on 1st and 15th
                if tx_date.day in (1, 15):
                    salary_cat = income_cats[0]
                    db.add(Transaction(
                        user_id=user.id,
                        category_id=salary_cat.id,
                        type="income",
                        amount=Decimal(str(rng.randint(45000, 55000))),
                        currency="RUB",
                        exchange_rate=Decimal("1"),
                        date=tx_date,
                        description="Зарплата",
                    ))

                # 1-3 expenses per day
                num_expenses = rng.randint(1, 3)
                for _ in range(num_expenses):
                    cat = rng.choice(expense_cats)
                    amount_map = {
                        "Продукты": (300, 3000),
                        "Транспорт": (50, 500),
                        "Кафе и рестораны": (200, 2000),
                        "ЖКХ": (1000, 5000),
                        "Связь": (200, 800),
                        "Развлечения": (500, 3000),
                        "Одежда": (500, 5000),
                        "Здоровье": (300, 3000),
                        "Образование": (500, 5000),
                    }
                    lo, hi = amount_map.get(cat.name, (100, 1000))
                    amount = Decimal(str(rng.randint(lo, hi)))
                    db.add(Transaction(
                        user_id=user.id,
                        category_id=cat.id,
                        type="expense",
                        amount=amount,
                        currency="RUB",
                        exchange_rate=Decimal("1"),
                        date=tx_date,
                        description=None,
                    ))

        await db.flush()

        # Budgets for current and previous 2 months
        for user in users:
            cats = user_categories[user.id]
            expense_cats = [c for c in cats if c.type == "expense"]
            for month_offset in range(3):
                yr = today.year
                mo = today.month - month_offset
                if mo <= 0:
                    mo += 12
                    yr -= 1
                year_month = f"{yr:04d}-{mo:02d}"
                for cat in rng.sample(expense_cats, 3):
                    db.add(Budget(
                        user_id=user.id,
                        category_id=cat.id,
                        year_month=year_month,
                        amount=Decimal(str(rng.randint(5000, 20000))),
                    ))

        await db.flush()

        # Recurring rules
        for user in users:
            cats = user_categories[user.id]
            income_cats = [c for c in cats if c.type == "income"]
            expense_cats = [c for c in cats if c.type == "expense"]

            # Salary rule
            db.add(RecurringRule(
                user_id=user.id,
                category_id=income_cats[0].id,
                type="income",
                amount=Decimal("50000"),
                currency="RUB",
                description="Ежемесячная зарплата",
                day_of_month=1,
                next_run_date=date(today.year, today.month, 1) if today.day < 1 else date(
                    today.year + (1 if today.month == 12 else 0),
                    today.month % 12 + 1,
                    1,
                ),
            ))
            # Subscription
            sub_cat = next(c for c in expense_cats if c.name == "Связь")
            db.add(RecurringRule(
                user_id=user.id,
                category_id=sub_cat.id,
                type="expense",
                amount=Decimal("399"),
                currency="RUB",
                description="Подписка на стриминг",
                day_of_month=15,
                next_run_date=date(today.year, today.month, 15) if today.day < 15 else date(
                    today.year + (1 if today.month == 12 else 0),
                    today.month % 12 + 1,
                    15,
                ),
            ))

        await db.commit()
        print("Seed completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
