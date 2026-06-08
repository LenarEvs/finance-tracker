from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exchange_rate import ExchangeRate
from app.schemas.exchange_rate import ExchangeRateCreate


class ExchangeRateService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, base: str | None, target: str | None, date: date | None) -> list[ExchangeRate]:
        raise NotImplementedError

    async def create(self, body: ExchangeRateCreate) -> ExchangeRate:
        raise NotImplementedError

    async def get_latest(self, base: str, target: str) -> ExchangeRate:
        raise NotImplementedError
