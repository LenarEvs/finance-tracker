import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    base_currency: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class CurrencyChangeRequest(BaseModel):
    base_currency: str = Field(min_length=3, max_length=3)
    conversion_rate: Decimal = Field(gt=0)
