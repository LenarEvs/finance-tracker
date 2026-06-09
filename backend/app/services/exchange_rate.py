from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exchange_rate import ExchangeRate
from app.schemas.exchange_rate import ExchangeRateCreate


class ExchangeRateService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(
        self, base: str | None, target: str | None, filter_date: date | None
    ) -> list[ExchangeRate]:
        q = select(ExchangeRate)
        if base:
            q = q.where(ExchangeRate.base_currency == base.upper())
        if target:
            q = q.where(ExchangeRate.target_currency == target.upper())
        if filter_date:
            q = q.where(ExchangeRate.date == filter_date)
        q = q.order_by(ExchangeRate.date.desc())
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def create(self, body: ExchangeRateCreate) -> ExchangeRate:
        rate = ExchangeRate(**body.model_dump())
        self.db.add(rate)
        await self.db.commit()
        await self.db.refresh(rate)
        return rate

    async def get_latest(self, base: str, target: str) -> ExchangeRate:
        result = await self.db.execute(
            select(ExchangeRate)
            .where(
                ExchangeRate.base_currency == base.upper(),
                ExchangeRate.target_currency == target.upper(),
            )
            .order_by(ExchangeRate.date.desc())
            .limit(1)
        )
        rate = result.scalar_one_or_none()
        if not rate:
            raise HTTPException(status_code=404, detail="Exchange rate not found")
        return rate
