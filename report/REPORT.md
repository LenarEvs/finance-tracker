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

---

### Этап 3–7 — Основная бизнес-логика бэкенда (2026-06-09)

#### Что было сделано

Реализована вся бизнес-логика бэкенда:

- **`CategoryService`** — CRUD с soft-delete (архивация). Простой select + flush/commit.
- **`TransactionService`** — CRUD с фильтрацией по дате/категории/типу/валюте, пагинация, запись audit log при каждой операции.
- **`BudgetService`** — CRUD + `get_progress()`: JOIN бюджетов с категориями, агрегация расходов по периоду, вычисление `percent_used`.
- **`ExchangeRateService`** — CRUD, `get_latest()` через ORDER BY date DESC LIMIT 1.
- **`DashboardService`** — 4 аналитических запроса: summary (GROUP BY type), expenses_by_category (JOIN + SUM), trend (to_char + date_trunc за 6 мес), top_categories (LIMIT 5).
- **`ImportExportService`** — экспорт CSV через `csv.writer`, импорт с валидацией строк, dry-run режим.
- **`RecurringRuleService`** — CRUD, автовычисление `next_run_date`.
- **`services/audit.py`** — вспомогательная функция `write_audit()`, используется из TransactionService и BudgetService.
- **APScheduler** — ежедневный job в `app/scheduler/__main__.py`, создаёт транзакции по активным recurring_rules, обновляет `next_run_date`.
- **Seed-скрипт** (`app/seed.py`) — 2 пользователя, 12 категорий каждому, 200+ транзакций за 6 месяцев, бюджеты, recurring rules, курсы валют. Запускается при старте приложения (lifespan), idempotent (проверяет дубль по email).
- **Entrypoint** (`entrypoint.sh`) — запускает `alembic upgrade head` перед стартом uvicorn.
- **CI** (`.github/workflows/ci.yml`) — lint (ruff) + pytest с PostgreSQL-сервисом.
- **13+ integration-тестов** по категориям: auth, transactions, budgets, recurring, import/export.

#### Ключевые решения

| Решение | Обоснование |
|---|---|
| `write_audit()` как утилита | Переиспользуется в нескольких сервисах без дублирования кода |
| `amount_base` не пишется в Python-коде | Это `GENERATED ALWAYS AS STORED` колонка PostgreSQL — SQLAlchemy записывает её автоматически |
| Seed в lifespan с idempotency-check | Удобно для docker compose — не нужна отдельная команда |
| dry_run в импорте | Позволяет пользователю проверить CSV перед реальной записью |

#### Открытые вопросы / следующий шаг

- Реализация фронтенда: страницы Transactions, Categories, Budgets, Dashboard, RecurringRules, ImportExport, AuditLog ✅
- Swagger UI доступен по `/docs`

---

### Этап 8 — Верстка фронтенда (2026-06-09)

#### Что было сделано

Реализована полная верстка всех страниц приложения. Все страницы используют inline styles без CSS-фреймворка.

**Layout-компоненты:**
- `Sidebar` — NavLink с активным состоянием (indigo), 7 пунктов навигации
- `Topbar` — имя пользователя из authStore + кнопка выхода с logout()
- `PageShell` — flex-layout: sidebar + content, опциональный `title` prop

**UI-компоненты:**
- `Button` — варианты primary/secondary/danger, размеры md/sm, disabled state
- `Modal` — оверлей с click-outside закрытием, опциональный заголовок, настраиваемая ширина

**Страницы:**
- `Dashboard` — 3 summary-карточки, month picker, PieChart + LineChart (Recharts), топ-5 таблица
- `Transactions` — фильтр-панель (дата/тип/категория/сумма), таблица с badge типа, пагинация, модальная форма добавления/редактирования
- `Categories` — сегмент-фильтр (все/расходы/доходы), карточки-сетка с иконкой+цветом, модальная форма с color picker
- `Budgets` — month picker, карточки с прогресс-баром (зелёный/оранжевый/красный), индикатор превышения
- `RecurringRules` — таблица с кнопкой паузы/запуска, модальная форма
- `ImportExport` — две панели: экспорт с фильтрами + drag-and-drop загрузка CSV с маппингом колонок
- `AuditLog` — фильтр-панель, таблица с цветными бейджами CREATE/UPDATE/DELETE, модальное окно с JSON до/после

**Формы:**
- `TransactionForm` — тип/дата/категория/сумма/валюта/курс/описание
- `BudgetForm` — месяц/категория/лимит

#### Ключевые решения

| Решение | Обоснование |
|---|---|
| Inline styles без CSS-фреймворка | Нет зависимости от Tailwind/MUI, полный контроль без сборки CSS |
| Mock-данные в каждой странице | Верстка работает независимо от бэкенда на этом этапе |
| NavLink из react-router-dom | Active state без ручного управления, синхронно с роутером |

#### Следующий шаг

- Подключить страницы к реальным API через React Query hooks ✅
- Seed данные через docker compose up

---

### Этап 9 — Подключение фронтенда к бэкенду (2026-06-09)

#### Что было сделано

Заменены все mock-данные на реальные API-вызовы. Все страницы теперь работают с живым бэкендом.

**Новые хуки и API-модули:**
- `api/auditLog.ts` — API для журнала изменений
- `hooks/useCategories.ts` — useCategories, useCreateCategory, useUpdateCategory, useArchiveCategory
- `hooks/useRecurringRules.ts` — CRUD-хуки для повторяющихся транзакций
- `hooks/useAuditLog.ts` — хук для журнала с фильтрами
- `hooks/useTransactions.ts` — дополнен useUpdateTransaction
- `hooks/useBudgets.ts` — дополнен useUpdateBudget, useDeleteBudget

**Формы:**
- `TransactionForm` — загружает категории из API, делает useCreateTransaction / useUpdateTransaction, показывает ошибки
- `BudgetForm` — загружает категории (expense) из API, create или update в зависимости от режима

**Страницы:**
- `Dashboard` — summary/pie/trend/top через React Query, month picker управляет всеми запросами
- `Transactions` — список из API с серверными фильтрами (дата/тип/категория/страница) + клиентская фильтрация по сумме, CRUD через модал
- `Categories` — сетка из API, inline форма создания/редактирования, архивирование
- `Budgets` — прогресс-бары из /budgets/progress, создание/редактирование/удаление бюджетов
- `RecurringRules` — таблица из API, toggle паузы, CRUD через модал с динамическими категориями
- `ImportExport` — экспорт: скачивание CSV-файла через Blob API; импорт: парсинг заголовков CSV, маппинг колонок, ремаппинг CSV перед отправкой, отображение результата (created/skipped/errors)
- `AuditLog` — пагинированный журнал с фильтрами, детальный просмотр в модале с JSON до/после

#### Ключевые решения

| Решение | Обоснование |
|---|---|
| Серверная фильтрация транзакций | Нет смысла грузить все транзакции клиентски — бэк поддерживает фильтры |
| Клиентская фильтрация по сумме | Бэкенд не поддерживает amount_min/max, быстрее добавить на клиенте |
| CSV ремаппинг на клиенте | Бэкенд ожидает фиксированные имена колонок; фронт переименовывает заголовки по маппингу пользователя |
| useCategories() внутри форм | Формы самодостаточны, не требуют передачи props сверху |
| confirm() перед удалением | Быстрое UX-решение без дополнительного модала подтверждения |

#### Открытые вопросы

- Нет toast-уведомлений об успехе операций (только ошибки)
- Нет оптимистичных обновлений (UX: после мутации список перезагружается)
- Amount min/max фильтрация только на клиенте (ограничение бэкенда)

---

### 2026-06-10 — Исправление иконок категорий

Иконки в seed-данных были записаны как Lucide-имена строками (`briefcase`, `laptop`, `trending-up` и т.д.), но библиотека `lucide-react` в проекте не использовалась. Фронтенд рендерил `{cat.icon}` как обычный текст.

**Решение:** заменил строковые имена на эмодзи в `backend/app/seed.py`. Выполнил одноразовый скрипт `fix_icons.py` (docker compose run) для обновления существующих записей в БД по таблице соответствий.

---

### 2026-06-10 — Редизайн UI с Tailwind CSS и lucide-react

**Задача:** Полный редизайн фронтенда в современном стиле.

**Что сделано:**
- Установлены `tailwindcss@^3`, `postcss`, `autoprefixer`, `lucide-react`
- Создан `src/index.css` с директивами `@tailwind` и переиспользуемыми слоями `.input`, `.card`, `.badge`
- Добавлена утилита `src/lib/cn.ts` для объединения классов
- Переработаны все компоненты: Sidebar (Lucide-иконки меню), Topbar, PageShell, Button, Modal
- Все 7 страниц (Dashboard, Transactions, Categories, Budgets, RecurringRules, ImportExport, AuditLog) полностью переведены с inline-стилей на Tailwind
- Login/Register обновлены до тёмного gradient-дизайна (`from-slate-900 via-indigo-950 to-slate-900`)
- Графики: заменены фиксированные `width/height` на `ResponsiveContainer` — больше не обрезаются; добавлены `CartesianGrid`, `Legend`, цвета; PieChart обновлён до donut-стиля

**Ключевые решения:**
- Tailwind v3 (не v4) — стабильная версия, JIT-режим из коробки
- `lucide-react` для SVG-иконок интерфейса; эмодзи в категориях остались — это данные пользователя
- `ResponsiveContainer` в Recharts — ширина чарта адаптируется к контейнеру без магических констант

---

### 2026-06-10 — Исправление 4 багов

**Задача:** Починить иконки в бюджетах и транзакциях, hover на линейном графике, пустой журнал изменений.

**Что сделано:**

**Баг 1 — иконки в бюджетах (Budgets.tsx:75):**  
`getCategoryIcon()` возвращала строку "t-shirt", которая рендерилась как `{getCategoryIcon()}` — текст напрямую в JSX. Добавлен импорт `CategoryIcon` и заменено на `<CategoryIcon name={getCategoryIcon()} size={20} />`.

**Баг 2 — hover на графике (LineChart.tsx):**  
Chart.js по умолчанию использует `interaction: { mode: "nearest", intersect: true }`. Поскольку `pointRadius: 0` (точки невидимы), курсор никогда не попадал на точку данных и тултип не появлялся. Добавлен `interaction: { mode: "index", intersect: false }` — тултип теперь появляется при наведении на любую вертикальную полосу графика для обоих датасетов сразу.

**Баг 3 — журнал изменений пустой (CategoryService):**  
`TransactionService` и `BudgetService` уже писали аудит-записи. `CategoryService` — нет. Поскольку операции с категориями (добавить, переименовать, архивировать) — наиболее частые, журнал оставался пустым. Добавлены вызовы `write_audit` в `create`, `update`, `archive` с полями before/after.

**Ключевые решения:**
- Иконки в транзакциях (`<CategoryIcon name={c.icon}>`) были правильными — ошибка только в бюджетах
- Для графика выбран mode "index" вместо "nearest" — показывает оба датасета (доходы + расходы) в одном тултипе
- В `archive` action задан "DELETE" (семантически архивирование = мягкое удаление)

---

### 2026-06-10 — Диагностика и исправление журнала изменений

**Задача:** Журнал изменений всегда пустой — ни одна запись не отображалась.

**Диагностика:**

1. `SELECT COUNT(*) FROM audit_log` — 9 записей, данные есть.
2. `docker compose logs backend` — `GET /api/v1/audit-log` возвращает **HTTP 500** `ResponseValidationError`:
   ```
   {'type': 'string_type', 'loc': ('response', 1, 'ip_address'),
    'msg': 'Input should be a valid string',
    'input': IPv4Address('172.18.0.5')}
   ```

**Корневая причина:**

SQLAlchemy + psycopg2 читает PostgreSQL `INET`-колонку как Python `ipaddress.IPv4Address`-объект. Pydantic v2 в строгом режиме отказывается приводить `IPv4Address → str` без явного разрешения. Pydantic-схема `AuditLogResponse` объявляла `ip_address: str | None` — при каждом запросе, где хотя бы одна запись содержала IP, endpoint падал с 500.

**Исправление (`schemas/audit_log.py`):**
- Тип поля заменён на `IPvAnyAddress | None` — принимает и `IPv4Address`, и `IPv6Address`, и строки
- Добавлен `@field_serializer("ip_address")` для явного приведения к `str` при JSON-сериализации

**Результат:** API возвращает все записи, фронтенд отображает журнал.

---

## CI Pipeline — аудит и исправление · 2026-06-13

**Задача:** убедиться, что `.github/workflows/ci.yml` работает корректно (lint + тесты + сборка).

**Найденные дефекты:**

1. **ruff — 7 ошибок** (4 unused imports + 3 E402):
   - `app/seed.py`: `AsyncSession`, `Base` — лишние импорты, удалены `--fix`
   - `app/services/import_export.py`: `TransactionCreate` — удалён `--fix`
   - `tests/conftest.py`: `pytest` — удалён `--fix`; E402 (импорты после `os.environ[…]`) — намеренный паттерн, подавлен через `# noqa: E402`

2. **ESLint сломан**: пакет отсутствовал в `devDependencies`, не было `eslint.config.js`. CI запускал `npx eslint`, который скачивал v10 и падал с «no config file». Исправление: добавлены `eslint`, `@eslint/js`, `globals`, `typescript-eslint`; создан `eslint.config.js` для TypeScript + React.

3. **Нет шага сборки**: `npm run build` нигде не вызывался в CI — сломанный vite-бандл прошёл бы незамеченным. Добавлен шаг `Build` в job `frontend-lint`.

**Итог после исправлений:**
- ruff: `All checks passed!`
- tsc: чистый (без ошибок)
- ESLint: 2 предупреждения `no-explicit-any` (не блокируют, `|| true`)
- `npm run build`: успешно, 1904 модулей, 5.74s

---

## Смена портов · 2026-06-13

**Задача:** сделать бэкенд доступным по `localhost:3000`, фронтенд — по `localhost:5173`.

**Что сделано:**
- В `docker-compose.yml` добавлены `ports` для backend (`3000:8000`) и frontend (`5173:5173`)
- В `vite.config.ts` добавлен `host: true` для доступности Vite dev-сервера с хоста
- Обновлены `README.md` (таблица ссылок) и `ARCHITECTURE.md` (таблица сервисов, схема docker-compose)

---

## Улучшение тестов · 2026-06-13

В ходе починки CI были исправлены нестабильные интеграционные тесты.

**Проблемы:**
- `AsyncEngine` с `asyncpg` использовал пул соединений, который конфликтовал с `pytest-asyncio` и закрывался раньше времени — тесты падали с `InterfaceError`
- `pythonpath` в `pytest.ini` не включал корень проекта — импорты модулей не находились
- Тесты авторизации ожидали неверные HTTP-коды: `200` вместо `201` для регистрации, `400` вместо `409` для дубля email

**Исправления:**
- Движок тестов переведён на `NullPool` — каждое соединение открывается и закрывается явно, без пула
- В `pytest.ini` добавлен `pythonpath = .`
- Ожидаемые статус-коды в тестах auth приведены к спецификации API

---

## AI-инструменты в разработке

### Инструмент

**Claude / Claude Code** (Anthropic, модель Sonnet 4.6) — взаимодействие через десктопное приложение Claude Code (Windows), интерфейс CLI, встроенный в проект через `.claude/` и `CLAUDE.md`.

### Какие задачи решались

| Задача | Доля участия AI |
|---|---|
| Генерация кода (бэкенд, фронтенд, тесты) | основная |
| Архитектурное проектирование (схема БД, эндпоинты, структура директорий) | основная |
| Написание и исправление тестов | основная |
| Диагностика и отладка (runtime-ошибки, CI-дефекты) | основная |
| Документация (ARCHITECTURE.md, REPORT.md, PROMPTS.md, CLAUDE.md) | основная |
| Рефакторинг и редизайн UI (Tailwind, Recharts) | основная |

Практически весь код проекта сгенерирован AI на основе описания требований в промптах. Ручная доработка применялась точечно — при отладке конкретных ошибок или когда первая итерация не соответствовала ожидаемому поведению.

### Показательный пример: P-003 — Архитектурное проектирование

**Промпт** (см. [PROMPTS.md → P-003](PROMPTS.md)): одним запросом попросили создать полный `ARCHITECTURE.md` — схему БД, список эндпоинтов, структуру директорий, Docker Compose конфигурацию и план разработки.

**Что получили:** полноценный документ — 7 таблиц БД с FK и CHECK-ограничениями, 39 REST-эндпоинтов, схема Docker Compose с 5 сервисами. Документ стал основой, которой следовали все последующие этапы.

**Что доработали вручную:**
- Добавили таблицу `refresh_tokens` (не была предусмотрена изначально — потребовалась при реализации JWT).
- Уточнили ограничение `day_of_month ≤ 28` для `recurring_rules` — AI предложил 31, но после размышления пришли к 28 как безопасному значению для всех месяцев.
- Скорректировали схему `audit_log`: поле `ip_address` как `INET` вместо `VARCHAR` — вылезло позже как источник `ResponseValidationError` в Pydantic v2.

### Ограничения: где AI работал плохо

**1. Синхронизация контекста между сессиями.** AI не помнит предыдущих сессий. При каждом старте нужно заново вводить контекст (`ARCHITECTURE.md`, `CLAUDE.md`). Без чётких правил в `CLAUDE.md` приходилось бы повторять одни и те же инструкции вручную.

**2. Несоответствие версий зависимостей.** При генерации кода AI иногда использовал устаревшие API. Пример: Pydantic v2 требует `model_config = ConfigDict(...)` вместо класса `Config` — пришлось точечно исправлять в нескольких схемах.

**3. Сложная отладка специфических конфигураций.** Ошибка с `IPv4Address → str` в Pydantic v2 (см. запись «Диагностика и исправление журнала изменений») потребовала нескольких итераций — AI предлагал решения, которые не учитывали взаимодействие SQLAlchemy + psycopg2 + Pydantic v2 в связке.

**4. Генерация тестов без живой БД.** Тесты были сгенерированы корректно по структуре, но конфигурация `conftest.py` (NullPool, `pythonpath`, статус-коды) не совпала с реальной средой выполнения и потребовала ручной доводки при первом запуске CI.


## 2026-06-13 — CI: линтеры теперь блокируют сборку

Убраны `|| true` из трёх шагов ci.yml: `ruff check`, `npx tsc --noEmit`, `npm run lint -- --max-warnings 0`.

Перед удалением проверено состояние каждого линтера:
- **ruff** — чисто, правок не потребовалось.
- **tsc** — чисто.
- **ESLint** — 2 предупреждения `no-explicit-any`:
  - `TransactionForm.tsx:41` — `as any` заменён на явный `Omit<Transaction, ...>` тип.
  - `ImportExport.tsx:86` — `as any` заменён на `as TransactionFilters`.

Теперь любой PR с lint-ошибками будет блокироваться CI.

---

### Этап 11 — Фильтрация по диапазону суммы (2026-06-13)

#### Что было сделано

- **Backend:** `GET /api/v1/transactions` принимает `amount_min` и `amount_max` (оба опциональные, `ge=0`). Валидация в роутере: если оба переданы и `amount_min > amount_max` — 422. Фильтрация в `TransactionService.list()` по `Transaction.amount_base` (GENERATED COLUMN).
- **Модель:** добавлен маппинг `amount_base: Mapped[Decimal]` с `Computed("amount * exchange_rate", persisted=True)` — колонка уже существовала в миграции, но в ORM-модели отсутствовала.
- **Frontend:** `TransactionFilters` расширен полями `amount_min`/`amount_max`. Создан хук `useDebounce<T>` (400ms). `Transactions.tsx` переведён с клиентской фильтрации (`Array.filter`) на серверную — debounced-значения передаются в `useTransactions`.
- **Тест:** `test_transaction_filter_by_amount_range` — создаёт транзакции 100/500/2000 RUB, проверяет что при `amount_min=200&amount_max=1000` возвращается только 500.

#### Ключевые решения

- Фильтрация по `amount_base`, а не по `amount` — исключает некорректное сравнение сумм в разных валютах.
- Debounce 400ms вместо немедленного запроса — избегает flood-запросов при вводе числа.

---

## Этап 11 · 2026-06-13 · Маппинг колонок при импорте CSV

### Что сделано

Реализован полноценный маппинг колонок CSV на бэкенде и фронтенде, позволяющий импортировать банковские выгрузки (Тинькофф, Сбер) без ручного переименования файла.

**Backend:**
- `POST /api/v1/import-export/import` принимает 5 query-параметров: `col_date`, `col_type`, `col_amount`, `col_currency`, `col_description` с дефолтами, совпадающими с текущими именами колонок.
- Перед парсингом проверяем наличие всех обязательных mapped-колонок (`fieldnames` из `csv.DictReader`); если колонка не найдена — HTTPException 422 с именами отсутствующих и доступных колонок.
- `col_description` используется при чтении поля description; `category_id` и `exchange_rate` остаются хардкоженными (не входят в задачу маппинга).

**Frontend:**
- `REQUIRED_FIELDS` заменён на `MAPPING_FIELDS` — только 5 полей с привязкой к query-param (`col_date` и т.д.).
- Удалена функция `remapCSV` — больше нет клиентской перестройки CSV.
- Оригинальный файл отправляется as-is; параметры маппинга идут как query params.
- Кнопка «Загрузить» заблокирована, пока не заполнены 4 обязательных поля (date, type, amount, currency).
- Ошибка 422 с деталями от бэкенда показывается пользователю напрямую.

### Ключевые решения

- **Маппинг на бэкенде, не на клиенте** — клиентский `remapCSV` был хрупким: неправильно парсил CSV с запятыми в значениях. Передача параметров в API решает проблему без рисков.
- **Дефолты = текущие имена** — обратная совместимость: существующие CSV-файлы и тесты работают без изменений.
- **Валидация до итерации** — `fieldnames` проверяем один раз до цикла, не внутри; при ошибке сразу 422, без частичного импорта.

---

## Этап 12 · 2026-06-13 · Исправление инфраструктурных ошибок Docker Compose

### Проблема 1: Race condition при запуске миграций

**Симптом:** `backend` падал с `UniqueViolationError: duplicate key value violates unique constraint "pg_type_typname_nsp_index"` — Alembic не мог создать таблицу `alembic_version`.

**Причина:** Оба сервиса — `backend` и `scheduler` — использовали один образ с `entrypoint.sh`, который запускает `alembic upgrade head`. При одновременном старте оба пытались создать `alembic_version` параллельно.

**Исправление:** В `docker-compose.yml` для `scheduler` добавлен `entrypoint: []` — сервис запускает `python -m app.scheduler` напрямую, без миграций. Том `pg_data` пересоздан через `docker compose down -v`.

### Проблема 2: Scheduler стартует раньше миграций

**Симптом:** После первого фикса scheduler падал с `UndefinedTableError: relation "recurring_rules" does not exist` — стартовал до завершения миграций backend.

**Причина:** `depends_on: postgres: service_healthy` гарантирует только готовность PostgreSQL, но не завершение `alembic upgrade head`.

**Исправление:**
- Добавлен `healthcheck` на сервис `backend`: проверяет `GET /health` каждые 10 сек, до 10 попыток, `start_period: 30s`.
- `scheduler` переведён на `depends_on: backend: condition: service_healthy` — запускается только после того, как backend ответил на healthcheck.
- В `app/scheduler/__main__.py` добавлен retry-loop на стартовом вызове: 10 попыток с паузой 10 сек — защита от временных сбоев.

### Ключевые решения

| Решение | Обоснование |
|---|---|
| `entrypoint: []` для scheduler | Проще и надёжнее, чем условный запуск миграций внутри скрипта |
| healthcheck на `/health` | Единственный надёжный способ убедиться, что миграции завершены — backend ответил |
| retry в `__main__.py` | Дополнительная защита без изменения архитектуры — scheduler не рушится из-за единичного сбоя соединения |

---

## 2026-06-15 — Исправление 4 дефектов по ревью

### Что было сделано

Устранены четыре дефекта, выявленных в ходе внешнего ревью.

**Дефект 1 (критичный) — `NoReferencedTableError` в scheduler:**
`jobs.py` импортировал только `RecurringRule` и `Transaction`. Модели `User`, `Category`, `ExchangeRate`, `Budget`, `AuditLog` никогда не регистрировались в `Base.metadata`, поэтому SQLAlchemy не мог разрешить FK `recurring_rules.user_id → users.id`. Добавлены 5 `import app.models.*` с `# noqa: F401` в начало `jobs.py`. `__main__.py` покрыт транзитивно через импорт `jobs`.

**Дефект 2 — 500 вместо 422 при невалидных данных:**
В `TransactionCreate` поля `amount` и `exchange_rate` принимали любое `Decimal`, в том числе отрицательное. В `CategoryCreate/Update` поле `color` принимало произвольную строку. Добавлены `Field(gt=0)` для числовых полей и `Field(min_length=3, max_length=3)` для `currency`. В обе схемы категории добавлен `@field_validator("color")` с проверкой регулярным выражением `#[0-9A-Fa-f]{6}` — неправильный формат теперь возвращает 422.

**Дефект 3 — конфликт порта 5432:**
`docker-compose.override.yml` пробрасывал порт `0.0.0.0:5432:5432`, что конфликтовало с локальным PostgreSQL. Изменено на `127.0.0.1:5433:5432` — порт привязан только к loopback и сменён на 5433.

**Дефект 4 — 403 вместо 401 при отсутствии токена:**
FastAPI `HTTPBearer` по умолчанию возвращает 403 при отсутствии заголовка `Authorization`. Изменено на `HTTPBearer(auto_error=False)`, добавлена явная проверка `if credentials is None → raise HTTPException(401)` с заголовком `WWW-Authenticate: Bearer`.

### Ключевые решения

| Решение | Обоснование |
|---|---|
| Импорты моделей через `import app.models.*` | Регистрирует классы в `Base.metadata` без изменения бизнес-логики |
| `Field(gt=0)` вместо кастомного валидатора | Pydantic v2 генерирует корректный 422 из `FieldInfo` автоматически |
| Общая функция `_validate_hex_color` | Два валидатора (`Create`/`Update`) переиспользуют одну реализацию |
| `127.0.0.1:5433` вместо `0.0.0.0:5432` | Исключает и конфликт с локальным PG, и внешний доступ к порту |

---

## 2026-06-15 — Улучшение CSV-экспорта транзакций

### Что было сделано

Переработан метод `export_csv` в `ImportExportService` ([import_export.py](../backend/app/services/import_export.py)).

- **Убрана колонка `id`** — UUID транзакции не несёт смысла для пользователя в выгрузке.
- **JOIN с таблицей `categories`** — вместо `category_id` (UUID) в CSV теперь выводится `category.name`. Запрос изменён с `select(Transaction)` на `select(Transaction, Category.name).outerjoin(Category, ...)`.
- **Нормализация чисел** — `amount` и `exchange_rate` форматируются через `format(Decimal(str(value)).normalize(), "f")`: `50000.0000 → 50000`, `1.000000 → 1`, `91.688607 → 91.688607`.
- **Русские заголовки** в порядке: `Дата, Тип, Сумма, Валюта, Курс, Категория, Описание`. Значения колонки `Тип` остались английскими (`income`/`expense`) для обратного импорта.

### Ключевые решения

| Решение | Обоснование |
|---|---|
| `outerjoin` вместо `join` | Транзакция с удалённой категорией не потеряется в экспорте |
| `format(d.normalize(), "f")` | `str(d.normalize())` даёт `5E+4` для `Decimal("50000")` — `"f"` форматтер принудительно выводит в нотации с фиксированной точкой |
| Значения `Тип` на английском | Парсер импорта ожидает `income`/`expense` |

---

### Этап 12 — Исправление nginx "host not found in upstream frontend" (2026-06-17)

#### Проблема

При `docker compose up` nginx падал с ошибкой:
```
[emerg] host not found in upstream "frontend" in /etc/nginx/conf.d/default.conf:24
```
Фронтенд был недоступен на порту 80. API и Swagger (порт 3000) работали.

#### Причина

Две проблемы одновременно:

1. **Неверный порт в nginx.conf для production**: `BUILD_TARGET=prod` собирает frontend-контейнер как static nginx на порту **80**, но `nginx.conf` проксировал на `frontend:5173` (порт Vite dev server). DNS разрешался, но соединение отвергалось.
2. **Отсутствие отказоустойчивости**: nginx читает все upstream-хосты при старте. Если frontend-контейнер не запустился (ошибка сборки, занятый порт), nginx крашился фатально с `host not found`.

#### Что изменено

| Файл | Изменение |
|---|---|
| `docker/nginx/Dockerfile` (новый) | Multi-stage: `node:20-alpine` → `npm run build` → `nginx:1.25-alpine`. Dist-файлы копируются в `/usr/share/nginx/html`. |
| `docker/nginx/nginx.conf` | Убран `proxy_pass http://frontend:5173`. Добавлен `root /usr/share/nginx/html` + `try_files $uri /index.html` (SPA fallback). |
| `docker/nginx/nginx.dev.conf` (новый) | Dev-конфиг: `/ → proxy_pass http://frontend:5173` с WS upgrade. |
| `docker-compose.yml` | `nginx`: `image: nginx:...` → `build: {context: ., dockerfile: docker/nginx/Dockerfile}`. Удалена служба `frontend`. |
| `docker-compose.override.yml` | Добавлена служба `frontend` (Vite dev server) с health check. `nginx` переопределён: монтируется `nginx.dev.conf`, добавлен `depends_on: frontend: condition: service_healthy`. |

#### Ключевые решения

| Решение | Обоснование |
|---|---|
| Встроить frontend в nginx-образ | Устраняет зависимость от отдельного контейнера и DNS-ошибку |
| Два nginx.conf (prod + dev) | Одна конфигурация не может обслуживать и статику, и Vite-прокси |
| Health check на Vite (`wget localhost:5173`) | Nginx ждёт готовности Vite перед стартом, избегая `host not found` в dev |

---

## История промптов

Полная хронология всех промптов, использованных в ходе разработки:
[report/PROMPTS.md](PROMPTS.md)

---