# Finance Tracker

Веб-приложение для учёта личных и семейных финансов: транзакции, бюджеты, категории, повторяющиеся платежи и аналитика.

## Стек

- **Backend:** FastAPI, SQLAlchemy (async), PostgreSQL 16, Alembic
- **Frontend:** React + TypeScript, Vite, Tailwind CSS, Chart.js
- **Инфраструктура:** Docker Compose, Nginx

---

## Запуск

### Требования

- Docker Desktop (или Docker Engine + Compose v2)

### Шаги

1. Скопируйте файл окружения и заполните переменные:

   ```bash
   cp .env.example .env
   ```

   Минимально необходимые переменные:

   ```
   DB_PASSWORD=your_password
   SECRET_KEY=your_secret_key
   ```

2. Запустите проект:

   ```bash
   docker compose up --build
   ```

3. Откройте браузер: [http://localhost](http://localhost)

4. (Опционально) Заполните базу тестовыми данными:

   ```bash
   docker compose exec backend python -m app.seed
   ```

---

## Тестовые учётные записи

После запуска сида доступны два пользователя:

| Email | Пароль | Описание |
|---|---|---|
| `personal@example.com` | `password123` | Личный бюджет (Иван Личный) |
| `family@example.com` | `password123` | Семейный бюджет (Семья Петровых) |

---

## Основные разделы

| Раздел | Описание |
|---|---|
| **Dashboard** | Обзор баланса, доходов и расходов за период |
| **Transactions** | Список транзакций с фильтрацией и сортировкой |
| **Categories** | Управление категориями доходов и расходов |
| **Budgets** | Постановка лимитов по категориям и отслеживание выполнения |
| **Recurring** | Настройка повторяющихся платежей |
| **Reports** | Графики и аналитика по периодам |

---

## Документация

| Файл | Содержимое |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Схема БД, структура проекта, REST API, Docker Compose |
| [`report/REPORT.md`](report/REPORT.md) | Журнал разработки: ключевые решения, этапы, открытые вопросы |
| [`report/PROMPTS.md`](report/PROMPTS.md) | История промптов с описанием результатов |
| `http://localhost/api/docs` | Swagger UI (доступен при запущенном проекте) |
