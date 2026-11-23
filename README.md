# HCI Lab 8 — реалізація готової продукції

REST API на Express 5 та MongoDB Atlas із Mongoose, JWT і двома ролями.

## Запуск

1. `npm ci`
2. Створити `.env` за прикладом `.env.example` і встановити власні секрети
3. `node scripts/seedManager.js` для початкового менеджера
4. `npm run dev`

## Перевірки

- `npm test` — модульні тести без бази даних
- `npm run test:smoke` — HTTP-перевірки Express без підключення до Atlas
- `npm run check` — перевірка синтаксису JavaScript

## Структура

- `src/routes` — маршрути та перевірка ролей
- `src/controllers` — отримання запиту й формування HTTP-відповіді
- `src/validators` — перевірка та нормалізація вхідних даних
- `src/services` — бізнес-логіка та запити Mongoose
- `src/models` — схеми MongoDB
- `src/middleware` — автентифікація, ролі та обробка помилок
- `src/utils` — спільні утиліти
- `tests/unit` — модульні перевірки
- `tests/integration` — HTTP smoke-тести

## Маршрути

- `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- `/api/products` — CRUD продукції
- `/api/discounts` — CRUD правил знижок
- `POST /api/sales` — створення покупки роллю customer
- `GET /api/sales/my` — власні покупки
- `GET /api/sales` — усі продажі для manager
- `GET /api/sales/:id` — продаж власника або менеджера

Для продажів кількість від 10 одиниць одного товару означає оптову ціну для цього товару. Знижки застосовуються до всієї покупки, обирається найбільша застосовна.
