from datetime import date

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user, get_db
from app.schemas.exchange_rate import ExchangeRateCreate, ExchangeRateResponse
from app.services.exchange_rate import ExchangeRateService

router = APIRouter(prefix="/exchange-rates", tags=["exchange_rates"])


@router.get("", response_model=list[ExchangeRateResponse])
async def list_rates(
    base: str | None = None,
    target: str | None = None,
    date: date | None = None,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    return await ExchangeRateService(db).list(base, target, date)


@router.post("", response_model=ExchangeRateResponse, status_code=201)
async def create_rate(
    body: ExchangeRateCreate,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    return await ExchangeRateService(db).create(body)


@router.get("/latest", response_model=ExchangeRateResponse)
async def get_latest_rate(
    base: str,
    target: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    return await ExchangeRateService(db).get_latest(base, target)
