import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.budget import Budget
from app.schemas.budget import BudgetCreate, BudgetProgress, BudgetUpdate


class BudgetService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, user_id: uuid.UUID, year_month: str | None = None) -> list[Budget]:
        raise NotImplementedError

    async def get(self, user_id: uuid.UUID, budget_id: uuid.UUID) -> Budget:
        raise NotImplementedError

    async def create(self, user_id: uuid.UUID, body: BudgetCreate) -> Budget:
        raise NotImplementedError

    async def update(self, user_id: uuid.UUID, budget_id: uuid.UUID, body: BudgetUpdate) -> Budget:
        raise NotImplementedError

    async def delete(self, user_id: uuid.UUID, budget_id: uuid.UUID) -> None:
        raise NotImplementedError

    async def get_progress(self, user_id: uuid.UUID, year_month: str) -> list[BudgetProgress]:
        raise NotImplementedError
