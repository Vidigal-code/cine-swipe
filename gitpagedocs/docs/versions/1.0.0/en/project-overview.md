# Project overview

CineSwipe is a fullstack movie catalog and store. Users browse a public catalog, watch trailers, buy movies, and manage a credit wallet; administrators manage movies, users, credit plans, and payment auditing.

## Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS 3.4, Redux Toolkit, TanStack React Query 5, axios, next-themes |
| Backend | NestJS 11, Prisma 6, PostgreSQL, RabbitMQ (`@nestjs/microservices`), Stripe 19, firebase-admin 13, JWT + JWE (jose), bcrypt, helmet, nestjs-pino |
| Infra | Docker Compose (postgres, rabbitmq, backend, frontend), Railway (deployment) |

## Repository structure

| Path | Contents |
|---|---|
| `backend/` | NestJS API: `src/`, `prisma/` (schema, migrations, seed), `tests/e2e/`, `Dockerfile`, `railway.toml` |
| `frontend/` | Next.js UI: `src/` in FSD architecture, `Dockerfile`, `railway.toml` |
| `docker-compose.yml` | Local orchestration of the 4 services |
| `envexample.txt` | Environment template for local execution |
| `docs/deploy/` | Railway runbook and production environment template |

## Backend architecture

The backend follows Clean Architecture-inspired layers in `backend/src/`:

- `domain/` — entities and repository interfaces (`user`, `movie`, `payment`, `credit`)
- `application/` — use-case services (`auth`, `admin-user`, `movie`, `payment`, `credit`, `media`)
- `infrastructure/` — Prisma and Firebase repositories, authentication guards, payment gateways, RabbitMQ clients
- `presentation/` — HTTP controllers, DTOs, and RMQ workers/dispatchers
- `shared/` — cookies, CSP, CORS, pagination, response factory, logger, upload security, pt-BR message catalogs
- `modules/` — Nest module wiring

## Frontend architecture

The frontend uses Feature-Sliced Design (FSD) in `frontend/src/`: `app` (routes and providers), `widgets`, `features`, `entities`, and `shared`. Redux holds only authentication state; all server data lives in React Query.

## Pluggable providers

A central characteristic: every external dependency has alternative implementations selected by environment variable:

| Variable | Options | Effect |
|---|---|---|
| `DATABASE_PROVIDER` | `postgres` (default), `firestore`, `realtime` | Prisma or Firebase repositories (single JSON state in `cineswipe_state`) |
| `AUTH_MODE` | `local` (default), `firebase`, `hybrid` | Local password, Firebase token, or both |
| `MEDIA_STORAGE_PROVIDER` | `local` (default), `firebase` | Uploads to disk (`/uploads/`) or Firebase Storage |
| `PAYMENT_FLOW_MODE` | `rmq` (default), `sync` | Asynchronous checkout via outbox + queue, or inline |
| `PAYMENT_PROVIDER` | `mock` (default), `stripe` | Simulated gateway or real Stripe |

## Notable design decisions

- **Trailer by URL**: movies store a YouTube `trailerUrl`; the player converts any YouTube link format into an embed, with a fallback after 6 seconds.
- **Session via HttpOnly cookies**: JWT access token + JWE refresh token + double-submit CSRF cookie; no tokens in localStorage.
- **Three-layer idempotency** in the payment flow: `idempotencyKey` on Stripe, the `processed_webhook_events` table, and the unique `(userId, correlationId)` constraint on the credit ledger.
- **Immutable auditing**: every payment event produces a row in `payment_audits` with a denormalized snapshot.
- All interface text is in pt-BR, kept in constants files (no i18n library).

> Version: 1.0.0
