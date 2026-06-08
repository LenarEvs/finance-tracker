from decimal import Decimal

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    year_month: str
    total_income: Decimal
    total_expense: Decimal
    balance: Decimal


class ExpenseByCategory(BaseModel):
    category_id: str
    category_name: str
    amount: Decimal
    percent: float


class MonthlyTrend(BaseModel):
    month: str
    income: Decimal
    expense: Decimal


class TopCategory(BaseModel):
    category_id: str
    category_name: str
    amount: Decimal
    rank: int
