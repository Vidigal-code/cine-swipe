# Backend and API

Movie catalog with authentication, profiles, administration, movie purchases, a credit wallet and referrals. Movie checkout charges its monetary price; it does not debit the wallet. Credits have their own checkout and consumption. Distinguish mock and Stripe modes when interpreting approved purchases.

## Workflow and failure cases

1. Registration/login validates local credentials or a Firebase token and creates a session. Access/refresh cookies are HttpOnly; the CSRF cookie is readable by the client and accompanies x-csrf-token when enabled. Refresh, logout, password/profile changes and avatars have dedicated endpoints. Movie list/detail feed browsing and checkout.

2. POST /payments/checkout receives movieId and creates correlationId. In rmq mode the repository creates a PENDING Purchase and outbox; the Prisma adapter writes both transactionally. A dispatcher publishes checkout.requested; a worker invokes the gateway, updates COMPLETED/FAILED and records audit events. Timeout, attempts and DLQ are configurable. In sync mode the gateway runs within the request.

3. The /payments/webhook/stripe webhook validates the signature using the raw body and STRIPE_WEBHOOK_SECRET. Previously processed events are recognized; payment_intent.succeeded/failed update purchases. purchaseKind routes credit purchases. correlationId provides gateway idempotency; processed events and the ledger add checks. Inspect each adapter before assuming Prisma-equivalent atomicity elsewhere.

4. Credit plans → /credits/checkout → dedicated outbox/worker → approval → ledger and balance. /credits/consume debits and rejects insufficient funds. Registration can award base/referral bonuses. A referred user's first approved credit purchase can reward the referrer; configuration, correlations and reward logs prevent repeated benefits in the intended flow. Admins manage users, plans/settings and audit.

| Method and path | Declaration |
| --- | --- |
| `DELETE /admin/credits/plans/:id` | [backend/src/presentation/controllers/admin-credit.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/admin-credit.controller.ts) |
| `DELETE /admin/users/:id` | [backend/src/presentation/controllers/admin-user.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/admin-user.controller.ts) |
| `DELETE /movies/:id` | [backend/src/presentation/controllers/movie.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/movie.controller.ts) |
| `GET /admin/credits/config` | [backend/src/presentation/controllers/admin-credit.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/admin-credit.controller.ts) |
| `GET /admin/credits/plans` | [backend/src/presentation/controllers/admin-credit.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/admin-credit.controller.ts) |
| `GET /admin/users` | [backend/src/presentation/controllers/admin-user.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/admin-user.controller.ts) |
| `GET /auth/me` | [backend/src/presentation/controllers/auth.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/auth.controller.ts) |
| `GET /credits/balance` | [backend/src/presentation/controllers/credit.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/credit.controller.ts) |
| `GET /credits/history` | [backend/src/presentation/controllers/credit.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/credit.controller.ts) |
| `GET /credits/plans` | [backend/src/presentation/controllers/credit.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/credit.controller.ts) |
| `GET /credits/purchases` | [backend/src/presentation/controllers/credit.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/credit.controller.ts) |
| `GET /health` | [backend/src/presentation/controllers/health.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/health.controller.ts) |
| `GET /movies/:id` | [backend/src/presentation/controllers/movie.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/movie.controller.ts) |
| `GET /movies` | [backend/src/presentation/controllers/movie.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/movie.controller.ts) |
| `GET /payments/admin/audits` | [backend/src/presentation/controllers/payment-audit.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/payment-audit.controller.ts) |
| `GET /payments/my-movies` | [backend/src/presentation/controllers/payment.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/payment.controller.ts) |
| `PATCH /admin/credits/config` | [backend/src/presentation/controllers/admin-credit.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/admin-credit.controller.ts) |
| `PATCH /admin/credits/plans/:id` | [backend/src/presentation/controllers/admin-credit.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/admin-credit.controller.ts) |
| `PATCH /admin/users/:id/role` | [backend/src/presentation/controllers/admin-user.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/admin-user.controller.ts) |
| `PATCH /admin/users/:id` | [backend/src/presentation/controllers/admin-user.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/admin-user.controller.ts) |
| `POST /admin/credits/plans` | [backend/src/presentation/controllers/admin-credit.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/admin-credit.controller.ts) |
| `POST /admin/users` | [backend/src/presentation/controllers/admin-user.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/admin-user.controller.ts) |
| `POST /auth/avatar/upload` | [backend/src/presentation/controllers/auth.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/auth.controller.ts) |
| `POST /auth/login` | [backend/src/presentation/controllers/auth.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/auth.controller.ts) |
| `POST /auth/logout` | [backend/src/presentation/controllers/auth.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/auth.controller.ts) |
| `POST /auth/refresh` | [backend/src/presentation/controllers/auth.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/auth.controller.ts) |
| `POST /auth/register` | [backend/src/presentation/controllers/auth.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/auth.controller.ts) |
| `POST /credits/checkout` | [backend/src/presentation/controllers/credit.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/credit.controller.ts) |
| `POST /credits/consume` | [backend/src/presentation/controllers/credit.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/credit.controller.ts) |
| `POST /movies/upload` | [backend/src/presentation/controllers/movie.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/movie.controller.ts) |
| `POST /movies` | [backend/src/presentation/controllers/movie.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/movie.controller.ts) |
| `POST /payments/checkout` | [backend/src/presentation/controllers/payment.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/payment.controller.ts) |
| `POST /payments/webhook/stripe` | [backend/src/presentation/controllers/stripe-webhook.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/stripe-webhook.controller.ts) |
| `PUT /auth/password` | [backend/src/presentation/controllers/auth.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/auth.controller.ts) |
| `PUT /auth/profile` | [backend/src/presentation/controllers/auth.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/auth.controller.ts) |
| `PUT /movies/:id` | [backend/src/presentation/controllers/movie.controller.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/controllers/movie.controller.ts) |

## Request example

```http
POST /payments/checkout HTTP/1.1
Cookie: <authenticated-session-cookies>
x-csrf-token: <csrf-token>
Content-Type: application/json

{"movieId":"<existing-movie-id>"}
```

## Related files

- [backend/src/application/payment/payment.service.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/application/payment/payment.service.ts)
- [backend/src/application/credit/credit.service.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/application/credit/credit.service.ts)
- [backend/src/presentation/workers/payment-outbox.dispatcher.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/workers/payment-outbox.dispatcher.ts)
- [backend/src/presentation/workers/payment.worker.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/workers/payment.worker.ts)
- [backend/src/shared/config/platform.config.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/shared/config/platform.config.ts)
- [backend/prisma/schema.prisma](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/prisma/schema.prisma)
- [docker-compose.yml](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/docker-compose.yml)

## Navigation

- [Project guide](?menu=en&lang=en&id=9)
- [Source reference](?menu=en&lang=en&id=10)
