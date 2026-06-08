import uuid
from datetime import datetime

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    user_id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    action: str
    before_data: dict | None
    after_data: dict | None
    ip_address: str | None
    occurred_at: datetime

    model_config = {"from_attributes": True}
