import uuid

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.schemas.recurring_rule import RecurringRuleCreate, RecurringRuleResponse, RecurringRuleUpdate

router = APIRouter(prefix="/recurring-rules", tags=["recurring_rules"])


@router.get("", response_model=list[RecurringRuleResponse])
async def list_rules(current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.post("", response_model=RecurringRuleResponse, status_code=201)
async def create_rule(body: RecurringRuleCreate, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.get("/{id}", response_model=RecurringRuleResponse)
async def get_rule(id: uuid.UUID, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.patch("/{id}", response_model=RecurringRuleResponse)
async def update_rule(id: uuid.UUID, body: RecurringRuleUpdate, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.delete("/{id}", status_code=204)
async def delete_rule(id: uuid.UUID, current_user=Depends(get_current_user)):
    raise NotImplementedError
