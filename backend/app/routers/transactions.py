import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, Request

from app.dependencies import get_current_user, get_db
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate
from app.services.transaction import TransactionService

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _get_ip(request: Request) -> str | None:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


@router.get("", response_model=list[TransactionResponse])
async def list_transactions(
    request: Request,
    from_: date | None = Query(None, alias="from"),
    to: date | None = None,
    category_id: uuid.UUID | None = None,
    type: str | None = None,
    currency: str | None = None,
    page: int = 1,
    limit: int = Query(50, le=200),
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    return await TransactionService(db).list(
        current_user.id,
        from_=from_,
        to=to,
        category_id=category_id,
        type=type,
        currency=currency,
        page=page,
        limit=limit,
    )


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
