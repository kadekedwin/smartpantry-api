# Smart Pantry API

Node.js + Express + SQLite implementation of the Smart Pantry REST API described in `api.md`.

## Requirements

- Node.js 18+

## Setup

```bash
npm install
cp .env.example .env
npm start
```

Server boots on `http://localhost:3000`. All endpoints are mounted under `/v1`.

For auto-reload during development:

```bash
npm run dev
```

## Environment

| Var | Default | Notes |
|-----|---------|-------|
| `PORT` | `3000` | HTTP port |
| `JWT_SECRET` | insecure dev fallback | **Set this in production** |
| `JWT_EXPIRES_IN` | `7d` | JWT lifetime |
| `DB_PATH` | `./data/smartpantry.db` | SQLite file path |

## Auth

Send `Authorization: Bearer <token>` for all protected endpoints. Tokens are issued by `/v1/auth/login` and `/v1/auth/register` and are invalidated on `/v1/auth/logout` (revocation is stored in the `revoked_tokens` table).

## Endpoints

| Method | Path |
|--------|------|
| POST | `/v1/auth/register` |
| POST | `/v1/auth/login` |
| POST | `/v1/auth/logout` |
| GET  | `/v1/profile` |
| GET  | `/v1/inventory?category=kulkas\|freezer\|rak_dapur` |
| POST | `/v1/inventory` |
| GET  | `/v1/shopping` |
| POST | `/v1/shopping` |
| PATCH | `/v1/shopping/:id/toggle` |
| GET  | `/v1/notifications` |

All responses follow the `{ "data": ..., "message": "..." }` envelope described in `api.md`.

## Notification job

`src/jobs/notifications.js` runs an expiry scan at startup and every 24 hours:

- Items expiring within 3 days → `warning` notification (deduped per day)
- Items with stock ≤ 1 → `stock` notification (deduped per day)
- Items past `expired_at` → `expired` notification and item is removed from inventory

The `cooking` notification type is defined in the schema but is intended to be produced by a separate menu-recommendation service.

## Quick smoke test

```bash
# register
curl -s -X POST http://localhost:3000/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"John","email":"john@example.com","password":"secret123"}'

# save the token from the response
TOKEN=...

# add an inventory item
curl -s -X POST http://localhost:3000/v1/inventory \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Wortel","icon":"🥕","stock":5,"unit":"biji","expired_at":"2026-07-08","category":"kulkas"}'

# list inventory
curl -s http://localhost:3000/v1/inventory -H "Authorization: Bearer $TOKEN"
```
