# Getting Started

This guide takes CineSwipe from zero to running locally.

## Prerequisites

- Docker and Docker Compose (recommended path), or
- Node.js 20+, PostgreSQL 16, and RabbitMQ to run without Docker

## Running with Docker (recommended)

1. Copy the environment template:

```bash
cp envexample.txt .env
```

2. Start everything:

```bash
docker-compose up --build
```

3. Access:

- Frontend: `http://localhost:3000`
- Backend (API): `http://localhost:3001`
- RabbitMQ management UI: `http://localhost:15672` (username/password: `guest`/`guest`)

The `docker-compose.yml` starts 4 services: `database` (postgres:16-alpine), `rabbitmq` (3-management-alpine), `backend`, and `frontend`. The backend starts with `npm run start:prod:migrate`, which runs `prisma generate`, `prisma migrate deploy`, the seed, and then the server.

## Running without Docker

Backend:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
npm run start:dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Make sure `DATABASE_URL` points to a reachable PostgreSQL instance and that `RABBITMQ_URL` points to a running RabbitMQ (or use `PAYMENT_FLOW_MODE=sync` to skip RabbitMQ entirely).

## What the seed creates

The `backend/prisma/seed.ts` populates:

- Credit system configuration (sign-up bonus 250, referrals enabled, referred-user bonus 50, referrer bonus 100)
- Credit plans: Bronze (300 credits / R$19.90), Prata (800 / R$44.90), Ouro (1800 / R$89.90)
- Admin user from `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (required)
- 4 demo movies with posters and YouTube trailers

## First access

1. Sign in with the admin user defined in `.env` or register a regular user at `/register`.
2. During registration, the password must be 8 to 64 characters with an uppercase letter, a lowercase letter, a number, and a symbol.
3. Optionally provide a referral code (`ref_...`) to receive the referred-user bonus.

## Tests

The backend has an e2e suite:

```bash
cd backend
npm run test:e2e
```

It covers authentication (cookies, CSRF, logout), movies with RBAC and upload, end-to-end asynchronous payments, auditing, admin user CRUD, and the Stripe webhook (signature and idempotency).

> Version: 1.0.0
