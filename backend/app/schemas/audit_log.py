import uuid
from datetime import datetime

from pydantic import BaseModel, IPvAnyAddress, field_serializer


class AuditLogResponse(BaseModel):
    id: int
    user_id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    action: str
    before_data: dict | None
    after_data: dict | None
    ip_address: IPvAnyAddress | None
    occurred_at: datetime

    model_config = {"from_attributes": True}

    @field_serializer("ip_address")
    def serialize_ip(self, v: IPvAnyAddress | None) -> str | None:
        return str(v) if v is not None else None
