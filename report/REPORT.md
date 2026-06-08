# Отчёт о разработке Finance Tracker

## О проекте

**Finance Tracker** — full-stack приложение для учёта личных финансов.  
Стек: FastAPI · PostgreSQL · React + TypeScript + Vite · Docker Compose.

---

## История создания

### Этап 0 — Составление плана выполнения (2026-06-08)

#### Что было сделано

Первым шагом — до написания любого кода и даже до проектирования схемы БД — изучили требования `PROJECT.md` и составили пошаговый план разработки.  
Это позволило сразу оценить объём работы и определить правильный порядок этапов.

#### Краткий план выполнения

| # | Этап | Ключевые задачи | Результат |
|---|---|---|---|
| 1 | **Проектирование** | Схема БД, ARCHITECTURE.md, структура директорий | `ARCHITECTURE.md` |
| 2 | **Backend — основа** | FastAPI, Alembic миграции, модели, JWT-авторизация, 2 seed-пользователя | API запускается, `/docs` работает |
| 3 | **Backend — транзакции и категории** | CRUD транзакций, категорий, фильтрация, пагинация, мультивалютность | Эндпоинты транзакций и категорий |
| 4 | **Backend — бюджеты, аудит, recurring** | Бюджеты с прогрессом, audit log, APScheduler для повторяющихся транзакций | Все бизнес-фичи на бэке |
| 5 | **Backend — CSV и seed** | Импорт/экспорт CSV, 200+ seed-транзакций за 6 мес, 12 категорий | Полный seed-датасет |
| 6 | **Frontend — основа** | React + Vite + TypeScript, роутинг, авторизация, layout | Приложение открывается в браузере |
| 7 | **Frontend — основные экраны** | Транзакции (список, форма, фильтры), категории, бюджеты | Базовый CRUD в UI |
| 8 | **Frontend — дашборд и доп. фичи** | Pie chart, line chart за 6 мес, топ-5, CSV import/export UI, audit log UI | Полный фронтенд |
| 9 | **Docker Compose и CI** | `docker compose up` поднимает всё, GitHub Actions lint + тесты, README | Финальная сборка |

---

### Этап 1 — Архитектурное проектирование (2026-06-08)

#### Что было сделано

Вторым шагом зафиксировали архитектуру **до написания кода** — чтобы не переделывать схему БД на середине разработки.  
Создан файл `ARCHITECTURE.md` с полным описанием:

- Схема БД (7 таблиц, FK, индексы, CHECK-ограничения)
- Структура директорий (`backend/`, `frontend/`, `docker/`)
- 39 REST API эндпоинтов
- Docker Compose с 5 сервисами
- Поэтапный план разработки (9 этапов, ~6 недель)

#### Ключевые решения на этапе проектирования

| Решение | Обоснование |
|---|---|
| `amount_base` как GENERATED COLUMN | Избегаем рассинхронизации — база сама пересчитывает при изменении `exchange_rate` |
| `day_of_month` ограничен до 28 | Март всегда имеет 31 день, февраль — нет; 28 безопасен для всех месяцев |
| `scheduler` как отдельный Docker-сервис | Изолируем фоновую работу от API-процесса; независимый перезапуск |
| Мягкое удаление категорий (`is_archived`) | Транзакции ссылаются на категории — hard delete сломает историю |
| `audit_log` пишется в сервисном слое, не триггерами | Даёт доступ к `user_id` из JWT-контекста, триггеры этого не видят |

#### Удачные шаги

- Проектирование схемы БД перед кодом выявило неочевидную зависимость: нужна таблица `exchange_rates` как справочник, иначе мультивалютность держится только на поле `exchange_rate` в транзакции без истории курсов.
- Разделение `recurring_rules` и `transactions` сразу, а не попытка добавить флаг `is_recurring` в одну таблицу — упрощает удаление правила без потери истории.

#### Неудачные шаги / открытые вопросы

- Не определили стратегию обновления курсов валют: ручной ввод (реализовано в плане) vs. автоматический фетч из внешнего API (ЦБ РФ / ExchangeRate-API). Оставлено на этап 3, потребует решения.
- В `budgets` нет поддержки бюджета на весь год — только помесячно. Если понадобится годовой бюджет, схема потребует доработки.

---

### Этап 2 — Создание основы бэкенда (2026-06-08)

#### Что было сделано

Создан полный скелет `backend/` согласно ARCHITECTURE.md — без бизнес-логики, только структура:

- **`app/main.py`** — FastAPI app factory с lifespan, `/health` эндпоинт, подключение всех роутеров
- **`app/config.py`** — `pydantic-settings`, читает `.env`
- **`app/database.py`** — async SQLAlchemy engine + `AsyncSessionLocal` + `Base`
- **`app/dependencies.py`** — `get_db`, заглушка `get_current_user`
- **`app/models/`** — 7 ORM-моделей: `User`, `Category`, `Transaction`, `RecurringRule`, `Budget`, `ExchangeRate`, `AuditLog`
- **`app/schemas/`** — Pydantic v2 схемы для всех доменов + `dashboard.py`
- **`app/routers/`** — 10 роутеров с объявленными эндпоинтами, тела заглушек `raise NotImplementedError`
- **`app/services/`** — 7 сервисных классов с интерфейсами методов, реализация отложена
- **`app/scheduler/jobs.py`** — заглушка APScheduler-джоба для повторяющихся транзакций
- **`alembic/`** — `env.py` с async-поддержкой, `script.py.mako`, папка `versions/`
- **`tests/`** — `conftest.py` + 5 тестовых файлов-заглушек
- **`docker-compose.yml`**, **`docker-compose.override.yml`**, **`.env.example`**
- **`docker/nginx/nginx.conf`**, **`docker/postgres/init.sql`** (uuid-ossp, pg_trgm)
- **`backend/Dockerfile`**, **`backend/requirements.txt`**

#### Ключевые решения

| Решение | Обоснование |
|---|---|
| `raise NotImplementedError` в роутерах и сервисах | Позволяет проверить структуру импортов без запуска логики |
| Сервисный слой как отдельные классы (не функции) | Упрощает тестирование через dependency injection |
| Все роутеры подключены в `main.py` сразу | Swagger `/docs` отобразит полный API с первого запуска |
| `alembic/env.py` с async engine | Соответствует asyncpg-стеку; синхронный env не поддерживает `asyncpg` |

#### Открытые вопросы

- `get_current_user` в `dependencies.py` — заглушка; реализация JWT придёт на этапе 2 (Auth).
- `scheduler/__main__` не реализован — нужен entry-point для `python -m app.scheduler`.

---

### Этап 3 — Создание основы фронтенда (2026-06-08)

#### Что было сделано

Создан полный скелет `frontend/` согласно ARCHITECTURE.md — React 18 + TypeScript + Vite:

- **`package.json`** — зависимости: React 18, React Router 6, Axios, Zustand, TanStack Query, Recharts
- **`vite.config.ts`** — dev-server с proxy `/api` → `http://backend:8000`
- **`tsconfig.json`** — strict-режим, bundler moduleResolution
- **`Dockerfile`** — multi-stage: `dev` (Vite HMR) + `build` + `prod` (nginx)
- **`src/types/index.ts`** — все TypeScript-интерфейсы (User, Transaction, Category, Budget, …)
- **`src/api/`** — 7 API-модулей: `client.ts` (Axios + interceptors-заглушки), auth, categories, transactions, budgets, recurringRules, dashboard, importExport
- **`src/store/`** — `authStore.ts` (Zustand: user, tokens, logout), `uiStore.ts` (sidebar toggle)
- **`src/hooks/`** — `useTransactions`, `useBudgets`, `useDashboard` (React Query обёртки)
- **`src/components/layout/`** — `Sidebar`, `Topbar`, `PageShell`
- **`src/components/ui/`** — `Button`, `Modal`
- **`src/components/charts/`** — `PieChart`, `LineChart` (Recharts-заглушки)
- **`src/components/forms/`** — `TransactionForm`, `BudgetForm`
- **`src/pages/`** — 9 страниц: Login, Register, Dashboard, Transactions, Categories, Budgets, RecurringRules, ImportExport, AuditLog
- **`src/App.tsx`** — React Router с маршрутами для всех страниц, fallback → `/dashboard`
- **`src/main.tsx`** — корневой render: QueryClientProvider + App

#### Ключевые решения

| Решение | Обоснование |
|---|---|
| TanStack Query для server state | Кэш, refetch, invalidation — не дублируем логику в Zustand |
| Zustand только для auth и UI | Локальное состояние (токены, sidebar) — не нужен сервер |
| `PageShell` — обёртка для защищённых страниц | Sidebar + Topbar рендерятся один раз, страницы — контент |
| Axios proxy через Vite `/api` | В dev не нужен CORS; в prod — nginx обрабатывает те же пути |

#### Открытые вопросы

- Защита роутов (guard для неавторизованных) — реализуется после слоя Auth.
- JWT-интерцепторы в `api/client.ts` — заглушки, ждут `authStore`.

---

---

### Этап 4 — JWT авторизация (2026-06-08)

#### Что было сделано

**Бэкенд:**
- `app/models/refresh_token.py` — ORM-модель таблицы `refresh_tokens` (jti, user_id, expires_at)
- `app/services/auth.py` — полная реализация `AuthService`: регистрация (bcrypt hash + дубль-email check), вход, выпуск пары токенов, refresh (lookup jti в БД + ротация), logout (удаление jti)
- `app/dependencies.py` — `get_current_user`: декодирует Bearer-токен, проверяет `type=access`, достаёт User из БД
- `app/routers/auth.py` — подключены все 4 эндпоинта через `AuthService(db)`
- `app/routers/users.py` — реализован `GET /users/me`
- `alembic/versions/0001_initial.py` — первая миграция: все 8 таблиц включая `refresh_tokens`
- `ARCHITECTURE.md` — добавлена таблица `1.7 refresh_tokens`

**Фронтенд:**
- `store/authStore.ts` — добавлен `persist` middleware Zustand (токены переживают перезагрузку страницы)
- `api/client.ts` — request interceptor прикрепляет `Authorization: Bearer`, response interceptor при 401 делает refresh (один промис на параллельные запросы) и повторяет оригинальный запрос
- `pages/Login.tsx` — форма входа: email + password, вызов `authApi.login`, затем `/users/me`, редирект на dashboard
- `pages/Register.tsx` — форма регистрации: имя + email + password, обработка 409
- `App.tsx` — компонент `RequireAuth` защищает все роуты кроме `/login` и `/register`

#### Ключевые решения

| Решение | Обоснование |
|---|---|
| `jti` (UUID) в refresh-токене + хранение в БД | Позволяет отозвать конкретный токен при logout; без хранения отзыв невозможен до истечения TTL |
| Ротация refresh-токенов при каждом refresh | Старый jti удаляется, выпускается новый — детектирует повторное использование украденного токена |
| Один shared Promise `refreshing` в interceptor | Предотвращает race condition: если несколько запросов вернули 401 одновременно, refresh выполняется один раз |
| `persist` Zustand в localStorage | Пользователь не разлогинивается при F5; токены хранятся под ключом `auth` |
| Миграция вручную (не autogenerate) | Нет живого соединения с БД в CI; explicit DDL проще ревьюить |

#### Открытые вопросы / следующий шаг

- Реализовать `PATCH /users/me` и `PATCH /users/me/password`
- Добавить очистку просроченных refresh-токенов (cron или при логине)
- Этап 3: Categories и Transactions CRUD

<!-- Новые записи добавляются ниже по мере продвижения по этапам -->
