import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class BudgetCreate(BaseModel):
    category_id: uuid.UUID
    year_month: str
    amount: Decimal


class BudgetUpdate(BaseModel):
    amount: Decimal


class BudgetResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: uuid.UUID
    year_month: str
    amount: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BudgetProgress(BaseModel):
    budget_id: uuid.UUID
    category_id: uuid.UUID
    category_name: str
    budget_amount: Decimal
    spent_amount: Decimal
    remaining: Decimal
    percent_used: float
