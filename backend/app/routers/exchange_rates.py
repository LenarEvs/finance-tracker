from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.schemas.exchange_rate import ExchangeRateCreate, ExchangeRateResponse

router = APIRouter(prefix="/exchange-rates", tags=["exchange_rates"])


@router.get("", response_model=list[ExchangeRateResponse])
async def list_rates(
    base: str | None = None,
    target: str | None = None,
    date: str | None = None,
    current_user=Depends(get_current_user),
):
    raise NotImplementedError


@router.post("", response_model=ExchangeRateResponse, status_code=201)
async def create_rate(body: ExchangeRateCreate, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.get("/latest", response_model=ExchangeRateResponse)
async def get_latest_rate(base: str, target: str, current_user=Depends(get_current_user)):
    raise NotImplementedError
