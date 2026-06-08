"""APScheduler job: daily check for recurring rules due today."""
import asyncio

from app.database import AsyncSessionLocal


async def create_recurring_transactions() -> None:
    """Find all active recurring_rules where next_run_date <= today and create transactions."""
    async with AsyncSessionLocal() as db:
        raise NotImplementedError


if __name__ == "__main__":
    asyncio.run(create_recurring_transactions())
