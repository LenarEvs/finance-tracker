import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_rule(client: AsyncClient, auth_headers: dict):
    cat_resp = await client.post("/api/v1/categories", json={
        "name": "RecCat", "icon": "repeat", "color": "#0000ff", "type": "expense",
    }, headers=auth_headers)
    cat_id = cat_resp.json()["id"]

    resp = await client.post("/api/v1/recurring-rules", json={
        "category_id": cat_id,
        "type": "expense",
        "amount": "399",
        "currency": "RUB",
        "description": "Monthly subscription",
        "day_of_month": 15,
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["day_of_month"] == 15
    assert float(data["amount"]) == 399.0


@pytest.mark.asyncio
async def test_list_rules(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/recurring-rules", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_update_rule(client: AsyncClient, auth_headers: dict):
    cat_resp = await client.post("/api/v1/categories", json={
        "name": "RecCat2", "icon": "repeat", "color": "#aaaaaa", "type": "income",
    }, headers=auth_headers)
    cat_id = cat_resp.json()["id"]
    created = await client.post("/api/v1/recurring-rules", json={
        "category_id": cat_id,
        "type": "income",
        "amount": "50000",
        "currency": "RUB",
        "day_of_month": 1,
    }, headers=auth_headers)
    rule_id = created.json()["id"]
    updated = await client.patch(f"/api/v1/recurring-rules/{rule_id}", json={
        "is_active": False,
    }, headers=auth_headers)
    assert updated.status_code == 200
    assert updated.json()["is_active"] is False
