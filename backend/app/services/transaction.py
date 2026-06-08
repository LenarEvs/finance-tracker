import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate


class TransactionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(
        self,
        user_id: uuid.UUID,
        from_: date | None = None,
        to: date | None = None,
        category_id: uuid.UUID | None = None,
        type: str | None = None,
        currency: str | None = None,
        page: int = 1,
        limit: int = 50,
    ) -> list[Transaction]:
        raise NotImplementedError

    async def get(self, user_id: uuid.UUID, transaction_id: uuid.UUID) -> Transaction:
        raise NotImplementedError

    async def create(self, user_id: uuid.UUID, body: TransactionCreate, ip_address: str | None = None) -> Transaction:
        raise NotImplementedError

    async def update(self, user_id: uuid.UUID, transaction_id: uuid.UUID, body: TransactionUpdate, ip_address: str | None = None) -> Transaction:
        raise NotImplementedError

    async def delete(self, user_id: uuid.UUID, transaction_id: uuid.UUID, ip_address: str | None = None) -> None:
        raise NotImplementedError
