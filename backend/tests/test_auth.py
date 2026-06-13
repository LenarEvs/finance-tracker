import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    unique = uuid.uuid4().hex[:8]
    resp = await client.post("/api/v1/auth/register", json={
        "email": f"new_{unique}@example.com",
        "password": "password123",
        "full_name": "New User",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    unique = uuid.uuid4().hex[:8]
    email = f"dup_{unique}@example.com"
    await client.post("/api/v1/auth/register", json={"email": email, "password": "pass123"})
    resp = await client.post("/api/v1/auth/register", json={"email": email, "password": "pass123"})
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    unique = uuid.uuid4().hex[:8]
    email = f"login_{unique}@example.com"
    await client.post("/api/v1/auth/register", json={"email": email, "password": "pass123"})
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": "pass123"})
    assert resp.status_code == 200
    assert resp.json()["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    unique = uuid.uuid4().hex[:8]
    email = f"badpw_{unique}@example.com"
    await client.post("/api/v1/auth/register", json={"email": email, "password": "correct"})
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": "wrong"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/users/me", headers=auth_headers)
    assert resp.status_code == 200
    assert "email" in resp.json()


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient):
    unique = uuid.uuid4().hex[:8]
    email = f"refresh_{unique}@example.com"
    reg = await client.post("/api/v1/auth/register", json={"email": email, "password": "pass123"})
    refresh_token = reg.json()["refresh_token"]
    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()
