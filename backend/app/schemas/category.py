import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    icon: str
    color: str
    type: Literal["income", "expense"]


class CategoryUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None
    color: str | None = None


class CategoryResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    icon: str
    color: str
    type: str
    is_archived: bool
    created_at: datetime

    model_config = {"from_attributes": True}
