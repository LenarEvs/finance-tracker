import pytest
from httpx import AsyncClient


async def create_category(client: AsyncClient, headers: dict, name: str = "Test Category") -> dict:
    resp = await client.post("/api/v1/categories", json={
        "name": name,
        "icon": "tag",
        "color": "#ff0000",
        "type": "expense",
    }, headers=headers)
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.asyncio
async def test_create_transaction(client: AsyncClient, auth_headers: dict):
    cat = await create_category(client, auth_headers, "TxCat1")
    resp = await client.post("/api/v1/transactions", json={
        "category_id": cat["id"],
        "type": "expense",
        "amount": "500.00",
        "currency": "RUB",
        "date": "2026-01-15",
        "description": "Test transaction",
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert float(data["amount"]) == 500.0
    assert data["type"] == "expense"


@pytest.mark.asyncio
async def test_list_transactions(client: AsyncClient, auth_headers: dict):
    cat = await create_category(client, auth_headers, "TxCat2")
    await client.post("/api/v1/transactions", json={
        "category_id": cat["id"],
        "type": "expense",
        "amount": "100",
        "currency": "RUB",
        "date": "2026-02-10",
    }, headers=auth_headers)
    resp = await client.get("/api/v1/transactions", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_get_transaction(client: AsyncClient, auth_headers: dict):
    cat = await create_category(client, auth_headers, "TxCat3")
    created = await client.post("/api/v1/transactions", json={
        "category_id": cat["id"],
        "type": "income",
        "amount": "2000",
        "currency": "RUB",
        "date": "2026-03-01",
    }, headers=auth_headers)
    tx_id = created.json()["id"]
    resp = await client.get(f"/api/v1/transactions/{tx_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == tx_id


@pytest.mark.asyncio
async def test_delete_transaction(client: AsyncClient, auth_headers: dict):
    cat = await create_category(client, auth_headers, "TxCat4")
    created = await client.post("/api/v1/transactions", json={
        "category_id": cat["id"],
        "type": "expense",
        "amount": "750",
        "currency": "RUB",
        "date": "2026-04-05",
    }, headers=auth_headers)
    tx_id = created.json()["id"]
    del_resp = await client.delete(f"/api/v1/transactions/{tx_id}", headers=auth_headers)
    assert del_resp.status_code == 204
    get_resp = await client.get(f"/api/v1/transactions/{tx_id}", headers=auth_headers)
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_transaction_filter_by_type(client: AsyncClient, auth_headers: dict):
    cat = await create_category(client, auth_headers, "TxCat5")
    await client.post("/api/v1/transactions", json={
        "category_id": cat["id"],
        "type": "income",
        "amount": "5000",
        "currency": "RUB",
        "date": "2026-05-01",
    }, headers=auth_headers)
    resp = await client.get("/api/v1/transactions?type=income", headers=auth_headers)
    assert resp.status_code == 200
    assert all(t["type"] == "income" for t in resp.json())
