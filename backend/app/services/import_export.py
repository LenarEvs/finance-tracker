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
        q = (
            select(Transaction, Category.name.label("category_name"))
            .outerjoin(Category, Transaction.category_id == Category.id)
            .where(Transaction.user_id == user_id)
        )
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
        rows = result.all()

        def _fmt(value) -> str:
            return format(Decimal(str(value)).normalize(), "f")

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Дата", "Тип", "Сумма", "Валюта", "Курс", "Категория", "Описание"])
        for tx, category_name in rows:
            writer.writerow([
                tx.date.isoformat(),
                tx.type,
                _fmt(tx.amount),
                tx.currency,
                _fmt(tx.exchange_rate),
                category_name or "",
                tx.description or "",
            ])

        return output.getvalue().encode("utf-8")

    async def import_csv(
        self,
        user_id: uuid.UUID,
        content: bytes,
        dry_run: bool = True,
        col_date: str = "date",
        col_type: str = "type",
        col_amount: str = "amount",
        col_currency: str = "currency",
        col_description: str = "description",
        col_category: str = "category",
    ) -> dict:
        from fastapi import HTTPException

        text = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))

        fieldnames = reader.fieldnames or []
        missing = [
            col for col in (col_date, col_type, col_amount, col_currency)
            if col not in fieldnames
        ]
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Колонки не найдены в файле: {', '.join(missing)}. "
                       f"Доступные колонки: {', '.join(fieldnames)}",
            )

        cats_result = await self.db.execute(
            select(Category).where(Category.user_id == user_id, Category.is_archived == False)  # noqa: E712
        )
        all_categories = cats_result.scalars().all()
        category_by_name: dict[str, uuid.UUID] = {c.name.lower(): c.id for c in all_categories}
        category_by_id: set[str] = {str(c.id) for c in all_categories}

        created = 0
        skipped = 0
        errors = []

        rows_to_create: list[Transaction] = []

        for i, row in enumerate(reader, start=2):
            try:
                raw_date = row.get(col_date, "").strip()
                raw_type = row.get(col_type, "").strip()
                raw_amount = row.get(col_amount, "").strip()
                raw_currency = row.get(col_currency, "").strip()
                raw_exchange_rate = row.get("exchange_rate", "1").strip() or "1"

                if not raw_date or not raw_type or not raw_amount or not raw_currency:
                    errors.append({"row": i, "error": "Missing required field"})
                    skipped += 1
                    continue

                raw_cat = row.get(col_category, "").strip()
                category_id: uuid.UUID | None = None
                if raw_cat:
                    category_id = category_by_name.get(raw_cat.lower())
                    if category_id is None and raw_cat in category_by_id:
                        category_id = uuid.UUID(raw_cat)

                if category_id is None:
                    errors.append({"row": i, "error": f"Категория не найдена: '{raw_cat}'"})
                    skipped += 1
                    continue

                tx_date = date.fromisoformat(raw_date)
                amount = Decimal(raw_amount)
                exchange_rate = Decimal(raw_exchange_rate)
                if amount <= 0:
                    raise ValueError("amount must be > 0")
                if raw_type not in ("income", "expense"):
                    raise ValueError(f"invalid type: {raw_type}")

                tx = Transaction(
                    user_id=user_id,
                    category_id=category_id,
                    type=raw_type,
                    amount=amount,
                    currency=raw_currency.upper(),
                    exchange_rate=exchange_rate,
                    date=tx_date,
                    description=row.get(col_description, "").strip() or None,
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
