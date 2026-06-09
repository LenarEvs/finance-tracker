import csv
import io
import uuid
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import AsyncIterator

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate


class ImportExportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def export_csv(
        self,
        user_id: uuid.UUID,
        from_: date | None = None,
        to: date | None = None,
        category_id: uuid.UUID | None = None,
        type: str | None = None,
        currency: str | None = None,
    ) -> AsyncIterator[bytes]:
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
        q = q.order_by(Transaction.date.desc())
        result = await self.db.execute(q)
        transactions = result.scalars().all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["id", "date", "type", "amount", "currency", "exchange_rate", "category_id", "description"])
        for tx in transactions:
            writer.writerow([
                str(tx.id),
                tx.date.isoformat(),
                tx.type,
                str(tx.amount),
                tx.currency,
                str(tx.exchange_rate),
                str(tx.category_id),
                tx.description or "",
            ])

        return output.getvalue().encode("utf-8")

    async def import_csv(self, user_id: uuid.UUID, content: bytes, dry_run: bool = True) -> dict:
        text = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))

        cats_result = await self.db.execute(
            select(Category).where(Category.user_id == user_id, Category.is_archived == False)  # noqa: E712
        )
        valid_category_ids = {str(c.id) for c in cats_result.scalars().all()}

        created = 0
        skipped = 0
        errors = []

        rows_to_create: list[Transaction] = []

        for i, row in enumerate(reader, start=2):
            try:
                raw_date = row.get("date", "").strip()
                raw_type = row.get("type", "").strip()
                raw_amount = row.get("amount", "").strip()
                raw_currency = row.get("currency", "").strip()
                raw_category_id = row.get("category_id", "").strip()
                raw_exchange_rate = row.get("exchange_rate", "1").strip() or "1"

                if not raw_date or not raw_type or not raw_amount or not raw_currency or not raw_category_id:
                    errors.append({"row": i, "error": "Missing required field"})
                    skipped += 1
                    continue

                tx_date = date.fromisoformat(raw_date)
                amount = Decimal(raw_amount)
                exchange_rate = Decimal(raw_exchange_rate)
                if amount <= 0:
                    raise ValueError("amount must be > 0")
                if raw_type not in ("income", "expense"):
                    raise ValueError(f"invalid type: {raw_type}")
                if raw_category_id not in valid_category_ids:
                    errors.append({"row": i, "error": f"category_id {raw_category_id} not found"})
                    skipped += 1
                    continue

                tx = Transaction(
                    user_id=user_id,
                    category_id=uuid.UUID(raw_category_id),
                    type=raw_type,
                    amount=amount,
                    currency=raw_currency.upper(),
                    exchange_rate=exchange_rate,
                    date=tx_date,
                    description=row.get("description", "").strip() or None,
                )
                rows_to_create.append(tx)
                created += 1
            except (ValueError, InvalidOperation, KeyError) as e:
                errors.append({"row": i, "error": str(e)})
                skipped += 1

        if not dry_run:
            for tx in rows_to_create:
                self.db.add(tx)
            await self.db.commit()

        return {"created": created, "skipped": skipped, "errors": errors}
