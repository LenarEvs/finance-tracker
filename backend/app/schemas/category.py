import re
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, field_validator


def _validate_hex_color(v: str) -> str:
    if not re.fullmatch(r"#[0-9A-Fa-f]{6}", v):
        raise ValueError("color must be a hex color like #RRGGBB")
    return v


class CategoryCreate(BaseModel):
    name: str
    icon: str
    color: str
    type: Literal["income", "expense"]

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str) -> str:
        return _validate_hex_color(v)


class CategoryUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None
    color: str | None = None

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return _validate_hex_color(v)


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
