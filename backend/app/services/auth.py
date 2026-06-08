import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _create_access_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(
        {"sub": str(user_id), "type": "access", "exp": expire},
        settings.secret_key,
        algorithm=ALGORITHM,
    )


def _create_refresh_token(user_id: uuid.UUID, jti: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    return jwt.encode(
        {"sub": str(user_id), "jti": str(jti), "type": "refresh", "exp": expire},
        settings.secret_key,
        algorithm=ALGORITHM,
    )


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, body: RegisterRequest) -> TokenResponse:
        existing = await self.db.scalar(select(User).where(User.email == body.email))
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        user = User(
            email=body.email,
            hashed_password=_hash_password(body.password),
            full_name=body.full_name,
        )
        self.db.add(user)
        await self.db.flush()  # get user.id without committing

        return await self._issue_tokens(user.id)

    async def login(self, body: LoginRequest) -> TokenResponse:
        user = await self.db.scalar(select(User).where(User.email == body.email))
        if not user or not _verify_password(body.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

        return await self._issue_tokens(user.id)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        try:
            payload = jwt.decode(refresh_token, settings.secret_key, algorithms=[ALGORITHM])
        except JWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

        jti = uuid.UUID(payload["jti"])
        stored = await self.db.scalar(select(RefreshToken).where(RefreshToken.jti == jti))
        if not stored:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked")

        await self.db.delete(stored)
        user_id = uuid.UUID(payload["sub"])
        return await self._issue_tokens(user_id)

    async def logout(self, refresh_token: str) -> None:
        try:
            payload = jwt.decode(refresh_token, settings.secret_key, algorithms=[ALGORITHM])
        except JWTError:
            return  # already invalid — treat as logged out

        jti = uuid.UUID(payload.get("jti", str(uuid.uuid4())))
        stored = await self.db.scalar(select(RefreshToken).where(RefreshToken.jti == jti))
        if stored:
            await self.db.delete(stored)

    async def _issue_tokens(self, user_id: uuid.UUID) -> TokenResponse:
        jti = uuid.uuid4()
        expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)

        rt = RefreshToken(user_id=user_id, jti=jti, expires_at=expire)
        self.db.add(rt)
        await self.db.commit()

        return TokenResponse(
            access_token=_create_access_token(user_id),
            refresh_token=_create_refresh_token(user_id, jti),
        )
