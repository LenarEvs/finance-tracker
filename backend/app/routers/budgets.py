import uuid

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.schemas.budget import BudgetCreate, BudgetProgress, BudgetResponse, BudgetUpdate

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=list[BudgetResponse])
async def list_budgets(year_month: str | None = None, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.post("", response_model=BudgetResponse, status_code=201)
async def create_budget(body: BudgetCreate, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.get("/progress", response_model=list[BudgetProgress])
async def get_budget_progress(year_month: str, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.get("/{id}", response_model=BudgetResponse)
async def get_budget(id: uuid.UUID, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.put("/{id}", response_model=BudgetResponse)
async def update_budget(id: uuid.UUID, body: BudgetUpdate, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.delete("/{id}", status_code=204)
async def delete_budget(id: uuid.UUID, current_user=Depends(get_current_user)):
    raise NotImplementedError
