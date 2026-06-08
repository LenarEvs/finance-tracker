from fastapi import APIRouter

from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest):
    raise NotImplementedError


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    raise NotImplementedError


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest):
    raise NotImplementedError


@router.post("/logout", status_code=204)
async def logout(body: RefreshRequest):
    raise NotImplementedError
