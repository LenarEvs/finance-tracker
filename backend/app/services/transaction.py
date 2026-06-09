import uuid
from datetime import date, datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate
from app.services.audit import write_audit


def _tx_to_dict(t: Transaction) -> dict:
    return {
        "id": str(t.id),
        "category_id": str(t.category_id),
        "type": t.type,
        "amount": str(t.amount),
        "currency": t.currency,
        "exchange_rate": str(t.exchange_rate),
        "date": t.date.isoformat(),
        "description": t.description,
        "is_recurring_instance": t.is_recurring_instance,
        "recurring_rule_id": str(t.recurring_rule_id) if t.recurring_rule_id else None,
    }


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
        q = select(Transaction).where(Transaction.user_id == user_id)
        if from_:
            q = q.where(Transaction.date >= from_)
        if to:
            q = q.where(Transaction.date <= to)
        if category_id:
            q = q.where(Transaction.category_id == category_id)
        if type:
            q = q.where(Transaction.type == type)
        if currency:
            q = q.where(Transaction.currency == currency)
        q = q.order_by(Transaction.date.desc(), Transaction.created_at.desc())
        q = q.offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def get(self, user_id: uuid.UUID, transaction_id: uuid.UUID) -> Transaction:
        result = await self.db.execute(
            select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user_id)
        )
        tx = result.scalar_one_or_none()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return tx

    async def create(
        self, user_id: uuid.UUID, body: TransactionCreate, ip_address: str | None = None
    ) -> Transaction:
        tx = Transaction(user_id=user_id, **body.model_dump())
        self.db.add(tx)
        await self.db.flush()
        await write_audit(
            self.db,
            user_id=user_id,
            entity_type="transaction",
            entity_id=tx.id,
            action="CREATE",
            before_data=None,
            after_data=_tx_to_dict(tx),
            ip_address=ip_address,
        )
        await self.db.commit()
        await self.db.refresh(tx)
        return tx

    async def update(
        self,
        user_id: uuid.UUID,
        transaction_id: uuid.UUID,
        body: TransactionUpdate,
        ip_address: str | None = None,
    ) -> Transaction:
        tx = await self.get(user_id, transaction_id)
        before = _tx_to_dict(tx)
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(tx, field, value)
        tx.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        await write_audit(
            self.db,
            user_id=user_id,
            entity_type="transaction",
            entity_id=tx.id,
            action="UPDATE",
            before_data=before,
            after_data=_tx_to_dict(tx),
            ip_address=ip_address,
        )
        await self.db.commit()
        await self.db.refresh(tx)
        return tx

    async def delete(
        self, user_id: uuid.UUID, transaction_id: uuid.UUID, ip_address: str | None = None
    ) -> None:
        tx = await self.get(user_id, transaction_id)
        before = _tx_to_dict(tx)
        await write_audit(
            self.db,
            user_id=user_id,
            entity_type="transaction",
            entity_id=tx.id,
            action="DELETE",
            before_data=before,
            after_data=None,
            ip_address=ip_address,
        )
        await self.db.delete(tx)
        await self.db.commit()
