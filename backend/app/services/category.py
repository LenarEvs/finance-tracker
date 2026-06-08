import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, user_id: uuid.UUID, type: str | None = None) -> list[Category]:
        raise NotImplementedError

    async def get(self, user_id: uuid.UUID, category_id: uuid.UUID) -> Category:
        raise NotImplementedError

    async def create(self, user_id: uuid.UUID, body: CategoryCreate) -> Category:
        raise NotImplementedError

    async def update(self, user_id: uuid.UUID, category_id: uuid.UUID, body: CategoryUpdate) -> Category:
        raise NotImplementedError

    async def archive(self, user_id: uuid.UUID, category_id: uuid.UUID) -> None:
        raise NotImplementedError
