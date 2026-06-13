"""Entry-point for the scheduler service: runs APScheduler daily job."""
import asyncio
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.scheduler.jobs import create_recurring_transactions

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main() -> None:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(create_recurring_transactions, "cron", hour=0, minute=5)
    scheduler.start()
    logger.info("Scheduler started. Running daily at 00:05.")
    for attempt in range(10):
        try:
            await create_recurring_transactions()
            break
        except Exception as exc:
            logger.warning("Startup job failed (attempt %d/10): %s", attempt + 1, exc)
            await asyncio.sleep(10)
    try:
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
