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

        # Exchange rates with realistic daily drift (±0.5% per day from previous)
        today = date.today()
        rng = random.Random(42)

        # Build rates oldest→newest so each day drifts from the previous
        usd_rub_by_date: dict[date, Decimal] = {}
        eur_rub_by_date: dict[date, Decimal] = {}
        usd_rate = 90.0
        eur_rate = 98.0
        for delta in range(179, -1, -1):
            d = today - timedelta(days=delta)
            usd_rate *= 1 + rng.uniform(-0.005, 0.005)
            eur_rate *= 1 + rng.uniform(-0.005, 0.005)
            usd_d = Decimal(str(round(usd_rate, 6)))
            eur_d = Decimal(str(round(eur_rate, 6)))
            usd_rub_by_date[d] = usd_d
            eur_rub_by_date[d] = eur_d
            for base, target, rate in [
                ("USD", "RUB", usd_d),
                ("EUR", "RUB", eur_d),
                ("RUB", "USD", Decimal(str(round(1 / usd_rate, 8)))),
                ("RUB", "EUR", Decimal(str(round(1 / eur_rate, 8)))),
            ]:
                db.add(ExchangeRate(base_currency=base, target_currency=target, rate=rate, date=d))

        # Transactions: 200+ per user over 6 months
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

        # Foreign-currency transactions (USD/EUR) — 15 per user
        fx_descriptions = [
            ("USD", "Оплата фриланс-заказа", "income", (200, 800)),
            ("USD", "Подписка на сервис", "expense", (10, 30)),
            ("USD", "Покупка в интернет-магазине", "expense", (30, 150)),
            ("EUR", "Оплата курса онлайн", "expense", (50, 200)),
            ("EUR", "Перевод из-за рубежа", "income", (300, 1000)),
        ]
        for user in users:
            cats = user_categories[user.id]
            income_cats = [c for c in cats if c.type == "income"]
            expense_cats = [c for c in cats if c.type == "expense"]
            all_dates = list(usd_rub_by_date.keys())
            for _ in range(15):
                currency, desc, tx_type, (lo, hi) = rng.choice(fx_descriptions)
                tx_date = rng.choice(all_dates)
                cat = rng.choice(income_cats if tx_type == "income" else expense_cats)
                amount = Decimal(str(rng.randint(lo, hi)))
                fx_rate = usd_rub_by_date[tx_date] if currency == "USD" else eur_rub_by_date[tx_date]
                db.add(Transaction(
                    user_id=user.id,
                    category_id=cat.id,
                    type=tx_type,
                    amount=amount,
                    currency=currency,
                    exchange_rate=fx_rate,
                    date=tx_date,
                    description=desc,
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
