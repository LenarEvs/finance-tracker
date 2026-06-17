from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogResponse
from app.schemas.page import Page

router = APIRouter(prefix="/audit-log", tags=["audit_log"])


@router.get("", response_model=Page[AuditLogResponse])
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
    base = select(AuditLog).where(AuditLog.user_id == current_user.id)
    if entity_type:
        base = base.where(AuditLog.entity_type == entity_type)
    if action:
        base = base.where(AuditLog.action == action)
    if from_:
        base = base.where(AuditLog.occurred_at >= from_)
    if to:
        base = base.where(AuditLog.occurred_at < to + timedelta(days=1))

    total: int = (
        await db.execute(select(func.count()).select_from(base.subquery()))
    ).scalar_one()

    items_q = base.order_by(AuditLog.occurred_at.desc()).offset((page - 1) * limit).limit(limit)
    items = (await db.execute(items_q)).scalars().all()
    return Page(items=items, total=total, page=page, pages=max(1, (total + limit - 1) // limit))


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
