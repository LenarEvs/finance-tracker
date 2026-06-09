import io
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_export_csv(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/import-export/export", headers=auth_headers)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]


@pytest.mark.asyncio
async def test_import_csv_dry_run(client: AsyncClient, auth_headers: dict):
    cat_resp = await client.post("/api/v1/categories", json={
        "name": "ImportCat", "icon": "upload", "color": "#ff00ff", "type": "expense",
    }, headers=auth_headers)
    cat_id = cat_resp.json()["id"]

    csv_content = f"date,type,amount,currency,exchange_rate,category_id,description\n2026-01-10,expense,1500,RUB,1,{cat_id},Test import\n"
    files = {"file": ("test.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    resp = await client.post(
        "/api/v1/import-export/import?dry_run=true",
        files=files,
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["created"] == 1
    assert data["skipped"] == 0


@pytest.mark.asyncio
async def test_import_csv_commit(client: AsyncClient, auth_headers: dict):
    cat_resp = await client.post("/api/v1/categories", json={
        "name": "ImportCat2", "icon": "upload", "color": "#ff8800", "type": "income",
    }, headers=auth_headers)
    cat_id = cat_resp.json()["id"]

    csv_content = f"date,type,amount,currency,exchange_rate,category_id,description\n2026-02-20,income,3000,RUB,1,{cat_id},Imported income\n"
    files = {"file": ("test.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    resp = await client.post(
        "/api/v1/import-export/import?dry_run=false",
        files=files,
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["created"] == 1
