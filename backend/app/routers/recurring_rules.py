import uuid

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user, get_db
from app.schemas.recurring_rule import RecurringRuleCreate, RecurringRuleResponse, RecurringRuleUpdate
from app.services.recurring_rule import RecurringRuleService

router = APIRouter(prefix="/recurring-rules", tags=["recurring_rules"])


@router.get("", response_model=list[RecurringRuleResponse])
async def list_rules(
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    return await RecurringRuleService(db).list(current_user.id)


@router.post("", response_model=RecurringRuleResponse, status_code=201)
async def create_rule(
    body: RecurringRuleCreate,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    return await RecurringRuleService(db).create(current_user.id, body)


@router.get("/{id}", response_model=RecurringRuleResponse)
async def get_rule(
    id: uuid.UUID,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    return await RecurringRuleService(db).get(current_user.id, id)


@router.patch("/{id}", response_model=RecurringRuleResponse)
async def update_rule(
    id: uuid.UUID,
    body: RecurringRuleUpdate,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    return await RecurringRuleService(db).update(current_user.id, id, body)


@router.delete("/{id}", status_code=204)
async def delete_rule(
    id: uuid.UUID,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    await RecurringRuleService(db).delete(current_user.id, id)
