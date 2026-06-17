# Finance Tracker — Architecture

## Table of Contents
1. [Database Schema](#1-database-schema)
2. [Project Structure](#2-project-structure)
3. [REST API Endpoints](#3-rest-api-endpoints)
4. [Docker Compose](#4-docker-compose)
5. [Development Plan](#5-development-plan)

---

## 1. Database Schema

### 1.1 users

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | Primary key |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| hashed_password | VARCHAR(255) | NOT NULL | bcrypt hash |
| full_name | VARCHAR(255) | | Display name |
| base_currency | CHAR(3) | NOT NULL, default 'RUB' | User's base currency |
| is_active | BOOLEAN | NOT NULL, default true | Soft-disable account |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### 1.2 categories

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NOT NULL | Owner |
| name | VARCHAR(100) | NOT NULL | Category name |
| icon | VARCHAR(50) | NOT NULL | Icon identifier (e.g. `shopping-cart`) |
| color | CHAR(7) | NOT NULL | Hex color `#RRGGBB` |
| type | VARCHAR(10) | NOT NULL, CHECK IN ('income','expense') | Applies to income or expense |
| is_archived | BOOLEAN | NOT NULL, default false | Hide from UI without deleting |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Index:** `(user_id, name)` UNIQUE WHERE `is_archived = false`

---

### 1.3 transactions

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NOT NULL | Owner |
| category_id | UUID | FK → categories.id, NOT NULL | |
| type | VARCHAR(10) | NOT NULL, CHECK IN ('income','expense') | |
| amount | NUMERIC(18,4) | NOT NULL, CHECK > 0 | Amount in original currency |
| currency | CHAR(3) | NOT NULL | ISO 4217 code |
| exchange_rate | NUMERIC(18,6) | NOT NULL, default 1 | Rate to user's base currency at time of transaction |
| amount_base | NUMERIC(18,4) | GENERATED ALWAYS AS (amount * exchange_rate) STORED | Amount in base currency |
| date | DATE | NOT NULL | Transaction date |
| description | TEXT | | Optional note |
| is_recurring_instance | BOOLEAN | NOT NULL, default false | Created by scheduler |
| recurring_rule_id | UUID | FK → recurring_rules.id, NULL | Source rule if recurring |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes:** `(user_id, date DESC)`, `(user_id, category_id)`, `(recurring_rule_id)`

---

### 1.4 recurring_rules

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NOT NULL | Owner |
| category_id | UUID | FK → categories.id, NOT NULL | |
| type | VARCHAR(10) | NOT NULL | `income` / `expense` |
| amount | NUMERIC(18,4) | NOT NULL | |
| currency | CHAR(3) | NOT NULL | |
| description | TEXT | | |
| day_of_month | SMALLINT | NOT NULL, CHECK 1..28 | Day to fire (capped at 28 for safety) |
| is_active | BOOLEAN | NOT NULL, default true | Pause without deleting |
| next_run_date | DATE | NOT NULL | Calculated by scheduler after each run |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### 1.5 budgets

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NOT NULL | Owner |
| category_id | UUID | FK → categories.id, NOT NULL | |
| year_month | CHAR(7) | NOT NULL | Format `YYYY-MM` |
| amount | NUMERIC(18,4) | NOT NULL, CHECK > 0 | Budget limit in base currency |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Index:** `(user_id, category_id, year_month)` UNIQUE

---

### 1.6 exchange_rates

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| base_currency | CHAR(3) | NOT NULL | e.g. `RUB` |
| target_currency | CHAR(3) | NOT NULL | e.g. `USD` |
| rate | NUMERIC(18,6) | NOT NULL | 1 base = rate target |
| date | DATE | NOT NULL | Rate date |

**Index:** `(base_currency, target_currency, date)` UNIQUE

---

### 1.7 refresh_tokens

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | Primary key |
| user_id | UUID | FK → users.id, NOT NULL | Owner |
| jti | UUID | UNIQUE, NOT NULL | JWT ID claim stored in the token |
| expires_at | TIMESTAMPTZ | NOT NULL | Token expiry |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Index:** `(user_id)`, `(jti)` UNIQUE

---

### 1.8 audit_log

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| user_id | UUID | FK → users.id, NOT NULL | Actor |
| entity_type | VARCHAR(50) | NOT NULL | e.g. `transaction`, `budget` |
| entity_id | UUID | NOT NULL | PK of the affected row |
| action | VARCHAR(10) | NOT NULL, CHECK IN ('CREATE','UPDATE','DELETE') | |
| before_data | JSONB | | Row state before change (NULL for CREATE) |
| after_data | JSONB | | Row state after change (NULL for DELETE) |
| ip_address | INET | | Request IP |
| occurred_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Index:** `(user_id, occurred_at DESC)`, `(entity_type, entity_id)`

---

### Entity Relationship Diagram (text)

```
users ──< categories
users ──< transactions >── categories
users ──< recurring_rules >── categories
users ──< budgets >── categories
transactions >── recurring_rules
users ──< audit_log
exchange_rates  (standalone lookup table)
```

---

## 2. Project Structure

```
finance-tracker/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app factory, lifespan
│   │   ├── config.py                # Settings via pydantic-settings
│   │   ├── database.py              # SQLAlchemy async engine + session
│   │   ├── dependencies.py          # get_db, get_current_user
│   │   │
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── category.py
│   │   │   ├── transaction.py
│   │   │   ├── recurring_rule.py
│   │   │   ├── budget.py
│   │   │   ├── exchange_rate.py
│   │   │   └── audit_log.py
│   │   │
│   │   ├── schemas/                 # Pydantic v2 request/response schemas
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── category.py
│   │   │   ├── transaction.py
│   │   │   ├── recurring_rule.py
│   │   │   ├── budget.py
│   │   │   ├── exchange_rate.py
│   │   │   ├── audit_log.py
│   │   │   └── dashboard.py
│   │   │
│   │   ├── routers/                 # APIRouter per domain
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── categories.py
│   │   │   ├── transactions.py
│   │   │   ├── recurring_rules.py
│   │   │   ├── budgets.py
│   │   │   ├── exchange_rates.py
│   │   │   ├── dashboard.py
│   │   │   ├── audit_log.py
│   │   │   └── import_export.py
│   │   │
│   │   ├── services/                # Business logic, audit writing
│   │   │   ├── auth.py
│   │   │   ├── category.py
│   │   │   ├── transaction.py
│   │   │   ├── budget.py
│   │   │   ├── dashboard.py
│   │   │   ├── import_export.py
│   │   │   └── exchange_rate.py
│   │   │
│   │   └── scheduler/
│   │       ├── __init__.py
│   │       └── jobs.py              # APScheduler recurring transaction job
│   │
│   ├── alembic/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_transactions.py
│   │   ├── test_budgets.py
│   │   ├── test_recurring.py
│   │   └── test_import_export.py
│   │
│   ├── alembic.ini
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── vite-env.d.ts
│   │   │
│   │   ├── api/                     # Axios instances + typed API calls
│   │   │   ├── client.ts            # Axios base, JWT interceptor
│   │   │   ├── auth.ts
│   │   │   ├── categories.ts
│   │   │   ├── transactions.ts
│   │   │   ├── budgets.ts
│   │   │   ├── recurringRules.ts
│   │   │   ├── dashboard.ts
│   │   │   └── importExport.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                  # Generic: Button, Modal, Table, Badge
│   │   │   ├── layout/              # Sidebar, Topbar, PageShell
│   │   │   ├── charts/              # PieChart, LineChart wrappers (Recharts)
│   │   │   └── forms/               # TransactionForm, BudgetForm, etc.
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Transactions.tsx
│   │   │   ├── Categories.tsx
│   │   │   ├── Budgets.tsx
│   │   │   ├── RecurringRules.tsx
│   │   │   ├── ImportExport.tsx
│   │   │   └── AuditLog.tsx
│   │   │
│   │   ├── store/                   # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   └── uiStore.ts
│   │   │
│   │   ├── hooks/                   # React Query hooks
│   │   │   ├── useTransactions.ts
│   │   │   ├── useBudgets.ts
│   │   │   └── useDashboard.ts
│   │   │
│   │   └── types/                   # Shared TypeScript interfaces
│   │       └── index.ts
│   │
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── Dockerfile
│
├── docker/
│   ├── nginx/
│   │   ├── Dockerfile               # Multi-stage: builds frontend → embeds in nginx
│   │   ├── nginx.conf               # Production: static file serving + SPA fallback
│   │   └── nginx.dev.conf           # Dev: proxy to Vite dev server
│   └── postgres/
│       └── init.sql                 # DB creation, extensions (uuid-ossp, pg_trgm)
│
├── docker-compose.yml
├── docker-compose.override.yml      # Dev overrides (hot reload volumes)
├── .env.example
└── ARCHITECTURE.md
```

---

## 3. REST API Endpoints

Base path: `/api/v1`
Auth: `Authorization: Bearer <JWT>` on all routes except `/auth/*`

### 3.1 Auth

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account, return tokens |
| POST | `/auth/login` | Email + password → access + refresh tokens |
| POST | `/auth/refresh` | Exchange refresh token for new access token |
| POST | `/auth/logout` | Invalidate refresh token (server-side blacklist) |

### 3.2 Users

| Method | Path | Description |
|---|---|---|
| GET | `/users/me` | Get current user profile |
| PATCH | `/users/me` | Update full_name, base_currency |
| PATCH | `/users/me/password` | Change password |

### 3.3 Categories

| Method | Path | Description |
|---|---|---|
| GET | `/categories` | List categories (filter: `?type=expense`) |
| POST | `/categories` | Create category |
| GET | `/categories/{id}` | Get single category |
| PATCH | `/categories/{id}` | Update name, icon, color |
| DELETE | `/categories/{id}` | Soft-delete (archive) |

### 3.4 Transactions

| Method | Path | Description |
|---|---|---|
| GET | `/transactions` | List with filters: `?from=&to=&category_id=&type=&currency=&page=&limit=` |
| POST | `/transactions` | Create transaction, write audit log |
| GET | `/transactions/{id}` | Get single transaction |
| PATCH | `/transactions/{id}` | Update transaction, write audit log |
| DELETE | `/transactions/{id}` | Delete, write audit log |

### 3.5 Recurring Rules

| Method | Path | Description |
|---|---|---|
| GET | `/recurring-rules` | List user's rules |
| POST | `/recurring-rules` | Create rule |
| GET | `/recurring-rules/{id}` | Get single rule |
| PATCH | `/recurring-rules/{id}` | Update rule (amount, day, pause) |
| DELETE | `/recurring-rules/{id}` | Delete rule |

### 3.6 Budgets

| Method | Path | Description |
|---|---|---|
| GET | `/budgets` | List budgets, filter: `?year_month=YYYY-MM` |
| POST | `/budgets` | Create budget for category + month |
| GET | `/budgets/{id}` | Get single budget |
| PUT | `/budgets/{id}` | Replace budget amount |
| DELETE | `/budgets/{id}` | Delete budget |
| GET | `/budgets/progress` | Budget vs. actual spending for `?year_month=` (used for progress bars) |

### 3.7 Exchange Rates

| Method | Path | Description |
|---|---|---|
| GET | `/exchange-rates` | List rates, filter: `?base=&target=&date=` |
| POST | `/exchange-rates` | Manually add rate |
| GET | `/exchange-rates/latest` | Latest rate for `?base=&target=` |

### 3.8 Dashboard

| Method | Path | Description |
|---|---|---|
| GET | `/dashboard/summary` | Total income, expense, balance for `?year_month=` |
| GET | `/dashboard/expenses-by-category` | Pie chart data: `{category, amount, percent}[]` for `?year_month=` |
| GET | `/dashboard/trend` | Line chart: monthly totals for last 6 months `{month, income, expense}[]` |
| GET | `/dashboard/top-categories` | Top-5 expense categories for `?year_month=` |

### 3.9 Import / Export

| Method | Path | Description |
|---|---|---|
| GET | `/import-export/export` | Download transactions as CSV, filter same as `/transactions` |
| POST | `/import-export/import` | Upload CSV, parse, dry-run or commit; returns `{created, skipped, errors}` |

### 3.10 Audit Log

| Method | Path | Description |
|---|---|---|
| GET | `/audit-log` | Paginated log for current user, filter: `?entity_type=&action=&from=&to=` |
| GET | `/audit-log/{id}` | Single audit entry |

---

## 4. Docker Compose

### Services

| Service | Image / Build | Internal Port | Exposed Port | Depends On |
|---|---|---|---|---|
| `postgres` | `postgres:16-alpine` | 5432 | 5433 (dev only) | — |
| `backend` | `./backend` (custom) | 8000 | **3000** | `postgres` (healthy) |
| `scheduler` | same image as `backend` | — | — | `backend` (healthy) |
| `nginx` | `docker/nginx/Dockerfile` (embeds built frontend) | 80 | **80** | `backend` (healthy) |
| `frontend` | `./frontend` (dev only, via override) | 5173 | 5173 | — |

> **Production** (`docker compose up`): nginx builds the frontend static files and serves them directly — no separate `frontend` service.  
> **Development** (`docker compose up` with override): Vite dev server starts as `frontend` service; nginx is overridden to proxy `/ → frontend:5173` using `nginx.dev.conf`.  
> Backend доступен напрямую на `localhost:3000`, Swagger — `localhost:3000/docs`.

### docker-compose.yml (schema)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    # ... (healthcheck included)

  backend:
    build: ./backend
    ports: ["3000:8000"]
    depends_on: { postgres: { condition: service_healthy } }
    healthcheck: ...

  scheduler:
    build: ./backend
    command: python -m app.scheduler
    depends_on: { backend: { condition: service_healthy } }

  nginx:
    build:
      context: .
      dockerfile: docker/nginx/Dockerfile   # embeds built frontend
    ports: ["80:80"]
    depends_on: { backend: { condition: service_healthy } }
```

### docker-compose.override.yml (dev additions)

```yaml
services:
  backend:
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    volumes: [./backend:/app]

  frontend:
    build: { context: ./frontend, target: dev }
    volumes: [./frontend:/app, /app/node_modules]
    ports: ["5173:5173"]
    healthcheck: { test: wget localhost:5173 }

  nginx:
    volumes:
      - ./docker/nginx/nginx.dev.conf:/etc/nginx/conf.d/default.conf
    depends_on: { frontend: { condition: service_healthy } }
```

### Nginx routing (порт 80)

**Production** (`nginx.conf` — static files from image):
```
GET /api/*         →  proxy_pass http://backend:8000
GET /docs          →  proxy_pass http://backend:8000/docs
GET /openapi.json  →  proxy_pass http://backend:8000/openapi.json
GET /*             →  try_files $uri /index.html  (SPA fallback)
```

**Development** (`nginx.dev.conf` — proxied Vite server):
```
GET /api/*         →  proxy_pass http://backend:8000
GET /*             →  proxy_pass http://frontend:5173  (+ WS upgrade)
```

### Nginx files

| File | Purpose |
|---|---|
| `docker/nginx/Dockerfile` | Multi-stage: builds frontend → embeds dist in nginx image |
| `docker/nginx/nginx.conf` | Production config (static file serving + SPA fallback) |
| `docker/nginx/nginx.dev.conf` | Dev config (proxy to Vite dev server) |

### Доступ

| Сервис | URL |
|---|---|
| Frontend (prod via nginx) | http://localhost |
| Frontend (dev direct) | http://localhost:5173 |
| Backend (FastAPI) | http://localhost:3000 |
| Swagger UI | http://localhost:3000/docs |

---

## 5. Development Plan

### Stage 1 — Foundation (Week 1)
| # | Task |
|---|---|
| 1.1 | Initialise monorepo, `.env.example`, `docker-compose.yml` + override |
| 1.2 | PostgreSQL service, `init.sql` with extensions (`uuid-ossp`) |
| 1.3 | FastAPI skeleton: config, `database.py`, lifespan, health endpoint |
| 1.4 | Alembic setup, first migration (users table) |
| 1.5 | Vite + React + TypeScript scaffold, Axios client, React Router |
| 1.6 | Nginx reverse-proxy config wiring everything together |

### Stage 2 — Authentication (Week 1–2)
| # | Task |
|---|---|
| 2.1 | `users` model + Alembic migration |
| 2.2 | bcrypt password hashing, JWT access + refresh token logic |
| 2.3 | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` endpoints |
| 2.4 | `get_current_user` dependency (row-level isolation enforced here) |
| 2.5 | React Login / Register pages, auth store (Zustand), Axios JWT interceptor |

### Stage 3 — Categories & Transactions (Week 2–3)
| # | Task |
|---|---|
| 3.1 | `categories` model, migration, CRUD endpoints + audit log writes |
| 3.2 | `transactions` model, migration, CRUD endpoints + audit log writes |
| 3.3 | `exchange_rates` table, migration, manual-add endpoint |
| 3.4 | Frontend: Categories page (icon/colour picker), Transactions page with filters |
| 3.5 | TransactionForm: currency selector, auto-fetch latest exchange rate |

### Stage 4 — Budgets & Progress (Week 3)
| # | Task |
|---|---|
| 4.1 | `budgets` model, migration, CRUD endpoints |
| 4.2 | `/budgets/progress` aggregation query |
| 4.3 | Frontend: Budgets page with progress-bar components |

### Stage 5 — Dashboard (Week 4)
| # | Task |
|---|---|
| 5.1 | Dashboard service: summary, expenses-by-category, trend, top-5 queries |
| 5.2 | Dashboard endpoints |
| 5.3 | Frontend: PieChart (Recharts), LineChart, summary cards, top-5 list |

### Stage 6 — Recurring Transactions (Week 4)
| # | Task |
|---|---|
| 6.1 | `recurring_rules` model, migration, CRUD endpoints |
| 6.2 | APScheduler job: daily check → create transactions for rules where `next_run_date <= today` |
| 6.3 | Scheduler `__main__` entry-point, separate Docker service |
| 6.4 | Frontend: Recurring Rules page |

### Stage 7 — Import / Export (Week 5)
| # | Task |
|---|---|
| 7.1 | CSV export endpoint (streaming response with `StreamingResponse`) |
| 7.2 | CSV import: validate rows, dry-run mode, commit mode |
| 7.3 | Frontend: Import/Export page, file upload, preview table, error list |

### Stage 8 — Audit Log UI & Hardening (Week 5)
| # | Task |
|---|---|
| 8.1 | Audit Log page (paginated table, filters by entity / action / date) |
| 8.2 | Before/after JSON diff viewer in modal |
| 8.3 | Input validation review, 403 row-ownership checks across all endpoints |
| 8.4 | Rate limiting (slowapi), CORS config, security headers in Nginx |

### Stage 9 — Testing & Polish (Week 6)
| # | Task |
|---|---|
| 9.1 | pytest suite: auth, transactions, budgets, recurring, import/export |
| 9.2 | Frontend: loading skeletons, empty states, error toasts |
| 9.3 | Production Dockerfile multi-stage builds, `docker-compose.prod.yml` |
| 9.4 | README with quick-start instructions |

---

*Last updated: 2026-06-08*
