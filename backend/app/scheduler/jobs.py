"""APScheduler job: daily check for recurring rules due today."""
import asyncio
from datetime import date

from sqlalchemy import select

import app.models.audit_log  # noqa: F401
import app.models.budget  # noqa: F401
import app.models.category  # noqa: F401
import app.models.exchange_rate  # noqa: F401
import app.models.user  # noqa: F401
from app.database import AsyncSessionLocal
from app.models.recurring_rule import RecurringRule
from app.models.transaction import Transaction


def _next_month_date(day: int, current_date: date) -> date:
    from calendar import monthrange
    year, month = current_date.year, current_date.month + 1
    if month > 12:
        month = 1
        year += 1
    last_day = monthrange(year, month)[1]
    return date(year, month, min(day, last_day))


async def create_recurring_transactions() -> None:
    """Find all active recurring_rules where next_run_date <= today and create transactions."""
    today = date.today()
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(RecurringRule).where(
                RecurringRule.is_active == True,  # noqa: E712
                RecurringRule.next_run_date <= today,
            )
        )
        rules = result.scalars().all()

        for rule in rules:
            tx = Transaction(
                user_id=rule.user_id,
                category_id=rule.category_id,
                type=rule.type,
                amount=rule.amount,
                currency=rule.currency,
                exchange_rate=1,
                date=rule.next_run_date,
                description=rule.description,
                is_recurring_instance=True,
                recurring_rule_id=rule.id,
            )
            db.add(tx)
            rule.next_run_date = _next_month_date(rule.day_of_month, rule.next_run_date)

        await db.commit()
        print(f"[scheduler] Created {len(rules)} recurring transactions for {today}")


if __name__ == "__main__":
    asyncio.run(create_recurring_transactions())
