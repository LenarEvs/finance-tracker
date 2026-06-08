from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.schemas.dashboard import DashboardSummary, ExpenseByCategory, MonthlyTrend, TopCategory

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def get_summary(year_month: str, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.get("/expenses-by-category", response_model=list[ExpenseByCategory])
async def get_expenses_by_category(year_month: str, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.get("/trend", response_model=list[MonthlyTrend])
async def get_trend(current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.get("/top-categories", response_model=list[TopCategory])
async def get_top_categories(year_month: str, current_user=Depends(get_current_user)):
    raise NotImplementedError
