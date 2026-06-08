import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class ExchangeRateCreate(BaseModel):
    base_currency: str
    target_currency: str
    rate: Decimal
    date: date


class ExchangeRateResponse(BaseModel):
    id: uuid.UUID
    base_currency: str
    target_currency: str
    rate: Decimal
    date: date

    model_config = {"from_attributes": True}
