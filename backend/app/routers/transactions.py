import uuid
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.dependencies import get_current_user, get_db
from app.schemas.page import Page
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate
from app.services.transaction import TransactionService

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _get_ip(request: Request) -> str | None:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


@router.get("", response_model=Page[TransactionResponse])
async def list_transactions(
    request: Request,
    from_: date | None = Query(None, alias="from"),
    to: date | None = None,
    category_id: uuid.UUID | None = None,
    type: str | None = None,
    currency: str | None = None,
    amount_min: Decimal | None = Query(None, ge=0),
    amount_max: Decimal | None = Query(None, ge=0),
    page: int = 1,
    limit: int = Query(50, le=200),
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    if amount_min is not None and amount_max is not None and amount_min > amount_max:
        raise HTTPException(status_code=422, detail="amount_min не может быть больше amount_max")
    items, total = await TransactionService(db).list(
        current_user.id,
        from_=from_,
        to=to,
        category_id=category_id,
        type=type,
        currency=currency,
        amount_min=amount_min,
        amount_max=amount_max,
        page=page,
        limit=limit,
    )
    return Page(items=items, total=total, page=page, pages=max(1, (total + limit - 1) // limit))


@router.post("", response_model=TransactionResponse, status_code=201)
async def create_transaction(
    request: Request,
    body: TransactionCreate,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    return await TransactionService(db).create(current_user.id, body, ip_address=_get_ip(request))


@router.get("/{id}", response_model=TransactionResponse)
async def get_transaction(
    id: uuid.UUID,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    return await TransactionService(db).get(current_user.id, id)


@router.patch("/{id}", response_model=TransactionResponse)
async def update_transaction(
    id: uuid.UUID,
    request: Request,
    body: TransactionUpdate,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    return await TransactionService(db).update(current_user.id, id, body, ip_address=_get_ip(request))


@router.delete("/{id}", status_code=204)
async def delete_transaction(
    id: uuid.UUID,
    request: Request,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    await TransactionService(db).delete(current_user.id, id, ip_address=_get_ip(request))
