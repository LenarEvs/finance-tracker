from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.schemas.audit_log import AuditLogResponse

router = APIRouter(prefix="/audit-log", tags=["audit_log"])


@router.get("", response_model=list[AuditLogResponse])
async def list_audit_log(
    entity_type: str | None = None,
    action: str | None = None,
    from_: str | None = None,
    to: str | None = None,
    page: int = 1,
    limit: int = 50,
    current_user=Depends(get_current_user),
):
    raise NotImplementedError


@router.get("/{id}", response_model=AuditLogResponse)
async def get_audit_entry(id: int, current_user=Depends(get_current_user)):
    raise NotImplementedError
