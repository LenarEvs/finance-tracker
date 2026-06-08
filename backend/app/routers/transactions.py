import uuid

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_current_user
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionResponse])
async def list_transactions(
    from_: str | None = Query(None, alias="from"),
    to: str | None = None,
    category_id: uuid.UUID | None = None,
    type: str | None = None,
    currency: str | None = None,
    page: int = 1,
    limit: int = 50,
    current_user=Depends(get_current_user),
):
    raise NotImplementedError


@router.post("", response_model=TransactionResponse, status_code=201)
async def create_transaction(body: TransactionCreate, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.get("/{id}", response_model=TransactionResponse)
async def get_transaction(id: uuid.UUID, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.patch("/{id}", response_model=TransactionResponse)
async def update_transaction(id: uuid.UUID, body: TransactionUpdate, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.delete("/{id}", status_code=204)
async def delete_transaction(id: uuid.UUID, current_user=Depends(get_current_user)):
    raise NotImplementedError
