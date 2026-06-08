from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.schemas.user import PasswordChangeRequest, UserResponse, UserUpdateRequest

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.patch("/me", response_model=UserResponse)
async def update_me(body: UserUpdateRequest, current_user=Depends(get_current_user)):
    raise NotImplementedError


@router.patch("/me/password", status_code=204)
async def change_password(body: PasswordChangeRequest, current_user=Depends(get_current_user)):
    raise NotImplementedError
