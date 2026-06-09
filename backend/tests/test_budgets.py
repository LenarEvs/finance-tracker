import pytest
from httpx import AsyncClient


async def create_cat(client, headers, name="BudgetCat"):
    resp = await client.post("/api/v1/categories", json={
        "name": name, "icon": "tag", "color": "#00ff00", "type": "expense",
    }, headers=headers)
    return resp.json()


@pytest.mark.asyncio
async def test_create_budget(client: AsyncClient, auth_headers: dict):
    cat = await create_cat(client, auth_headers, "BudCat1")
    resp = await client.post("/api/v1/budgets", json={
        "category_id": cat["id"],
        "year_month": "2026-05",
        "amount": "10000",
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["year_month"] == "2026-05"
    assert float(data["amount"]) == 10000.0


@pytest.mark.asyncio
async def test_list_budgets(client: AsyncClient, auth_headers: dict):
    cat = await create_cat(client, auth_headers, "BudCat2")
    await client.post("/api/v1/budgets", json={
        "category_id": cat["id"], "year_month": "2026-04", "amount": "5000",
    }, headers=auth_headers)
    resp = await client.get("/api/v1/budgets?year_month=2026-04", headers=auth_headers)
    assert resp.status_code == 200
    assert any(b["year_month"] == "2026-04" for b in resp.json())


@pytest.mark.asyncio
async def test_budget_progress(client: AsyncClient, auth_headers: dict):
    cat = await create_cat(client, auth_headers, "BudCat3")
    await client.post("/api/v1/budgets", json={
        "category_id": cat["id"], "year_month": "2026-06", "amount": "8000",
    }, headers=auth_headers)
    await client.post("/api/v1/transactions", json={
        "category_id": cat["id"],
        "type": "expense",
        "amount": "2000",
        "currency": "RUB",
        "date": "2026-06-05",
    }, headers=auth_headers)
    resp = await client.get("/api/v1/budgets/progress?year_month=2026-06", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    entry = next(d for d in data if d["category_id"] == cat["id"])
    assert float(entry["spent_amount"]) == 2000.0
    assert float(entry["budget_amount"]) == 8000.0
