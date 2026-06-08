import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


class RecurringRuleCreate(BaseModel):
    category_id: uuid.UUID
    type: Literal["income", "expense"]
    amount: Decimal
    currency: str
    description: str | None = None
    day_of_month: int


class RecurringRuleUpdate(BaseModel):
    amount: Decimal | None = None
    day_of_month: int | None = None
    is_active: bool | None = None
    description: str | None = None


class RecurringRuleResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: uuid.UUID
    type: str
    amount: Decimal
    currency: str
    description: str | None
    day_of_month: int
    is_active: bool
    next_run_date: date
    created_at: datetime

    model_config = {"from_attributes": True}
