from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.routers import (
    audit_log,
    auth,
    budgets,
    categories,
    dashboard,
    exchange_rates,
    import_export,
    recurring_rules,
    transactions,
    users,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Finance Tracker API", version="1.0.0", lifespan=lifespan)

API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(categories.router, prefix=API_PREFIX)
app.include_router(transactions.router, prefix=API_PREFIX)
app.include_router(recurring_rules.router, prefix=API_PREFIX)
app.include_router(budgets.router, prefix=API_PREFIX)
app.include_router(exchange_rates.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)
app.include_router(import_export.router, prefix=API_PREFIX)
app.include_router(audit_log.router, prefix=API_PREFIX)


@app.get("/health")
async def health():
    return {"status": "ok"}
