import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


class TransactionCreate(BaseModel):
    category_id: uuid.UUID
    type: Literal["income", "expense"]
    amount: Decimal
    currency: str
    exchange_rate: Decimal = Decimal("1")
    date: date
    description: str | None = None


class TransactionUpdate(BaseModel):
    category_id: uuid.UUID | None = None
    amount: Decimal | None = None
    currency: str | None = None
    exchange_rate: Decimal | None = None
    date: date | None = None
    description: str | None = None


class TransactionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: uuid.UUID
    type: str
    amount: Decimal
    currency: str
    exchange_rate: Decimal
    date: date
    description: str | None
    is_recurring_instance: bool
    recurring_rule_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
