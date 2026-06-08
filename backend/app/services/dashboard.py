import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.dashboard import DashboardSummary, ExpenseByCategory, MonthlyTrend, TopCategory


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def summary(self, user_id: uuid.UUID, year_month: str) -> DashboardSummary:
        raise NotImplementedError

    async def expenses_by_category(self, user_id: uuid.UUID, year_month: str) -> list[ExpenseByCategory]:
        raise NotImplementedError

    async def trend(self, user_id: uuid.UUID) -> list[MonthlyTrend]:
        raise NotImplementedError

    async def top_categories(self, user_id: uuid.UUID, year_month: str) -> list[TopCategory]:
        raise NotImplementedError
