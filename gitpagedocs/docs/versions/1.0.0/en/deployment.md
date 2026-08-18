# Deployment

## Local Docker

The `docker-compose.yml` at the root orchestrates 4 services:

| Service | Image/Build | Port | Notes |
|---|---|---|---|
| `database` | postgres:16-alpine | 5432 | `pgdata` volume |
| `rabbitmq` | rabbitmq:3-management-alpine | 5672 / 15672 | Management UI at `:15672` |
| `backend` | `backend/Dockerfile` | 3001 | Command `npm run start:prod:migrate`; `backend_uploads` volume |
| `frontend` | `frontend/Dockerfile` | 3000 | `NEXT_PUBLIC_*` passed as build args |

```bash
cp envexample.txt .env
docker-compose up --build
```

## Dockerfiles

- **Backend** (`backend/Dockerfile`): `node:20-alpine`, `npm install`, copies `prisma/` and the code, `prisma generate`, `nest build`, exposes 3001. Default CMD `npm run start:prod` (compose overrides it with the migration variant).
- **Frontend** (`frontend/Dockerfile`): `node:20-alpine`, receives `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_START_THEME` as ARG/ENV, `next build`, exposes 3000. Since `NEXT_PUBLIC_*` variables are baked in at build time, changing the API URL requires a rebuild.

## Railway (production)

Full runbook in `docs/deploy/railway.md`; variable template in `docs/deploy/.envexampledeploy.txt`. There are **two services**:

1. **cine-swipe-backend** — root `backend`, NIXPACKS, build `npm install && npm run build`, start `npm run start:prod:migrate`, restart ON_FAILURE (10 attempts). With `DATABASE_PROVIDER` = `firestore`/`realtime`, switch the start command to `npm run start:prod` (no Prisma migration).
2. **cine-swipe-frontend** — root `frontend`, same build, start `npm run start -- -p ${PORT:-3000}`.

Provision PostgreSQL and RabbitMQ (Railway plugins or external) and fill in `DATABASE_URL` and `RABBITMQ_URL`. Alternatively, use `PAYMENT_FLOW_MODE=sync` to skip RabbitMQ entirely.

## Migrations and seed

- Prisma migrations in `backend/prisma/migrations/` (`0001_init` through `0006_processed_webhook_events`), applied with `prisma migrate deploy`.
- The seed (`prisma/seed.ts`) is idempotent and runs inside `start:prod:migrate`: credit configuration, plans, admin, and demo movies.
- Besides the seed, `admin-seed.service.ts` re-upserts the admin on every boot (only with `DATABASE_PROVIDER=postgres`).

## Stripe in production

1. Set `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET`.
2. Register the webhook endpoint in the Stripe dashboard:

```
https://<backend-domain>/payments/webhook/stripe
```

3. Subscribe to the `payment_intent.succeeded` and `payment_intent.payment_failed` events.

## Post-deploy checklist

- `GET /health` responds `{"status":"ok"}`
- Admin login works and cookies are set (with HTTPS, use `AUTH_COOKIE_SECURE=true`; for distinct frontend/backend domains, `AUTH_COOKIE_SAMESITE=none`)
- `CORS_ALLOWED_ORIGINS` includes the frontend's public URL
- The catalog lists the seeded movies
- A test purchase completes the full cycle (PENDING → COMPLETED in `rmq` mode)
- The `/admin/audit` panel records the events

## CI

The repository has no pipelines (no `.github/workflows`). Lint and tests run manually: `npm run lint` (both packages) and `npm run test:e2e` (backend).

> Version: 1.0.0
