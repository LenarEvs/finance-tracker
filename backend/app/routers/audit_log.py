from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogResponse

router = APIRouter(prefix="/audit-log", tags=["audit_log"])


@router.get("", response_model=list[AuditLogResponse])
async def list_audit_log(
    entity_type: str | None = None,
    action: str | None = None,
    from_: date | None = Query(None, alias="from"),
    to: date | None = None,
    page: int = 1,
    limit: int = Query(50, le=200),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(AuditLog).where(AuditLog.user_id == current_user.id)
    if entity_type:
        q = q.where(AuditLog.entity_type == entity_type)
    if action:
        q = q.where(AuditLog.action == action)
    if from_:
        q = q.where(AuditLog.occurred_at >= from_)
    if to:
        q = q.where(AuditLog.occurred_at < to + timedelta(days=1))
    q = q.order_by(AuditLog.occurred_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{id}", response_model=AuditLogResponse)
async def get_audit_entry(
    id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AuditLog).where(AuditLog.id == id, AuditLog.user_id == current_user.id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Audit entry not found")
    return entry
