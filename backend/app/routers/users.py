from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from passlib.context import CryptContext
from sqlalchemy import case, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.user import (
    CurrencyChangeRequest,
    PasswordChangeRequest,
    UserResponse,
    UserUpdateRequest,
)

router = APIRouter(prefix="/users", tags=["users"])

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updates = body.model_dump(exclude_unset=True)
    if "email" in updates and updates["email"] != current_user.email:
        conflict = await db.scalar(
            select(User).where(User.email == updates["email"]).where(User.id != current_user.id)
        )
        if conflict:
            raise HTTPException(status_code=409, detail="Email already in use")
    for field, value in updates.items():
        setattr(current_user, field, value)
    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.patch("/me/currency", response_model=UserResponse)
async def change_currency(
    body: CurrencyChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.base_currency == current_user.base_currency:
        raise HTTPException(status_code=400, detail="Currency is already set to this value")

    rate = body.conversion_rate

    # Transactions already in the new currency keep their own amount unchanged
    # (exchange_rate -> 1). Everything else was rate-stamped against the OLD
    # base currency, so dividing by the user-supplied rate re-bases it onto
    # the new one. GREATEST floors the result at the smallest representable
    # unit so a very small amount / large rate can't round down to zero and
    # silently zero out the transaction's base-currency contribution.
    await db.execute(
        update(Transaction)
        .where(Transaction.user_id == current_user.id)
        .values(
            exchange_rate=case(
                (Transaction.currency == body.base_currency, Decimal("1")),
                else_=func.greatest(Transaction.exchange_rate / rate, Decimal("0.000001")),
            )
        )
    )
    # Budgets have no currency/rate of their own — always re-base. Floored for
    # the same reason; a budget can never go to zero/negative (CHECK amount > 0).
    await db.execute(
        update(Budget)
        .where(Budget.user_id == current_user.id)
        .values(amount=func.greatest(Budget.amount / rate, Decimal("0.0001")))
    )

    current_user.base_currency = body.base_currency
    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.patch("/me/password", status_code=204)
async def change_password(
    body: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not _pwd_context.verify(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = _pwd_context.hash(body.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()
