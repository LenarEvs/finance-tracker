from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, body: RegisterRequest) -> TokenResponse:
        raise NotImplementedError

    async def login(self, body: LoginRequest) -> TokenResponse:
        raise NotImplementedError

    async def refresh(self, refresh_token: str) -> TokenResponse:
        raise NotImplementedError

    async def logout(self, refresh_token: str) -> None:
        raise NotImplementedError
