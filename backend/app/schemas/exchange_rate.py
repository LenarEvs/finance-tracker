from __future__ import annotations

import uuid
from datetime import date as Date
from decimal import Decimal

from pydantic import BaseModel


class ExchangeRateCreate(BaseModel):
    base_currency: str
    target_currency: str
    rate: Decimal
    date: Date


class ExchangeRateResponse(BaseModel):
    id: uuid.UUID
    base_currency: str
    target_currency: str
    rate: Decimal
    date: Date

    model_config = {"from_attributes": True}
