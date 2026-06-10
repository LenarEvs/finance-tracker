from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, user_id: uuid.UUID, type: str | None = None) -> list[Category]:
        q = select(Category).where(
            Category.user_id == user_id,
            Category.is_archived == False,  # noqa: E712
        )
        if type:
            q = q.where(Category.type == type)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def get(self, user_id: uuid.UUID, category_id: uuid.UUID) -> Category:
        result = await self.db.execute(
            select(Category).where(Category.id == category_id, Category.user_id == user_id)
        )
        cat = result.scalar_one_or_none()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        return cat

    async def create(self, user_id: uuid.UUID, body: CategoryCreate) -> Category:
        cat = Category(user_id=user_id, **body.model_dump())
        self.db.add(cat)
        await self.db.commit()
        await self.db.refresh(cat)
        return cat

    async def update(self, user_id: uuid.UUID, category_id: uuid.UUID, body: CategoryUpdate) -> Category:
        cat = await self.get(user_id, category_id)
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(cat, field, value)
        await self.db.commit()
        await self.db.refresh(cat)
        return cat

    async def archive(self, user_id: uuid.UUID, category_id: uuid.UUID) -> None:
        cat = await self.get(user_id, category_id)
        cat.is_archived = True
        await self.db.commit()
