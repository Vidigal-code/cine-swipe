# Backend and API

NestJS 11 API with Prisma 6 on PostgreSQL, RabbitMQ messaging, and Clean Architecture-inspired layers (`domain` → `application` → `infrastructure` / `presentation`).

## Bootstrap

`backend/src/main.ts` initializes with `rawBody: true` (required for the Stripe signature), the pino logger, configuration validation (`validatePlatformConfig()`), `cookie-parser`, helmet with environment-driven CSP, CORS with credentials, a global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`), and static assets at `/uploads/`. When `PAYMENT_FLOW_MODE=rmq`, it also connects a RabbitMQ microservice (durable queue, DLX to the DLQ, `noAck: false`, configurable prefetch).

Global guards: `ThrottlerGuard` (rate limiting) and `RolesGuard` (RBAC via `@Roles` metadata).

## Endpoints

### Authentication — `/auth`

| Method | Route | Guard | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Registration (with optional referral code); sets 3 cookies |
| POST | `/auth/login` | — | Local login or with `firebaseIdToken` |
| POST | `/auth/refresh` | — | Renews the session (manual CSRF check) |
| GET | `/auth/me` | JWT | Current user |
| POST | `/auth/logout` | JWT | Clears cookies |
| PUT | `/auth/profile` | JWT | Updates name/e-mail |
| PUT | `/auth/password` | JWT | Password change (strong policy + bcrypt) |
| POST | `/auth/avatar/upload` | JWT | Avatar upload (multipart) |

### Movies — `/movies`

| Method | Route | Guard |
|---|---|---|
| GET | `/movies` | Public (paginated) |
| GET | `/movies/:id` | Public |
| POST | `/movies` | JWT + ADMIN |
| POST | `/movies/upload` | JWT + ADMIN (poster) |
| PUT | `/movies/:id` | JWT + ADMIN |
| DELETE | `/movies/:id` | JWT + ADMIN |

### Payments — `/payments`

| Method | Route | Guard | Description |
|---|---|---|---|
| POST | `/payments/checkout` | JWT | Starts a movie purchase (`{movieId}`) |
| GET | `/payments/my-movies` | JWT | Paginated COMPLETED purchases |
| GET | `/payments/admin/audits` | JWT + ADMIN | Audit trail |
| POST | `/payments/webhook/stripe` | Stripe signature | Webhook (no guard; validates `stripe-signature`) |

### Credits — `/credits` and `/admin/credits`

| Method | Route | Guard | Description |
|---|---|---|---|
| GET | `/credits/balance` | JWT | Current balance |
| GET | `/credits/plans` | JWT | Active plans |
| GET | `/credits/history` | JWT | Transaction history (ledger) |
| GET | `/credits/purchases` | JWT | Credit purchases |
| POST | `/credits/checkout` | JWT | Plan purchase (`{creditPlanId}`) |
| POST | `/credits/consume` | JWT | Consumption (`{amount, description, correlationId?}`) |
| GET/POST | `/admin/credits/plans` | JWT + ADMIN | List/create plans |
| PATCH/DELETE | `/admin/credits/plans/:id` | JWT + ADMIN | Edit/remove plan |
| GET/PATCH | `/admin/credits/config` | JWT + ADMIN | Global configuration |

### Users (admin) — `/admin/users`

Full CRUD: `GET`, `POST`, `PATCH /:id`, `PATCH /:id/role`, `DELETE /:id`. Safety rules: an admin cannot delete themselves, cannot change their own role, and cannot demote/delete the last ADMIN.

### Health

`GET /health` → `{status: "ok"}`.

## Authentication and session

Three modes via `AUTH_MODE`: `local`, `firebase`, and `hybrid` (the presence of `firebaseIdToken` selects the Firebase path). The session lives in 3 cookies:

- `cine_access_token` — signed JWT (`JWT_SECRET`, default expiration 1d), HttpOnly
- `cine_refresh_token` — JWE (`jose`, A256GCM, key = SHA-256 of `AUTH_JWE_SECRET`, default 7d), HttpOnly
- `cine_csrf_token` — random token, readable by JS (double-submit pattern)

The `JwtAuthGuard` reads the cookie first and falls back to `Authorization: Bearer`; when the token came from a cookie and the method is a mutation, it requires `x-csrf-token` to match the cookie. Role escalation is blocked: requesting `ADMIN` at registration only works if the e-mail matches `ADMIN_EMAIL`.

Password policy: 8–64 characters with a lowercase letter, an uppercase letter, a digit, and a symbol; bcrypt hash (cost 10).

## Data model (Prisma)

Main models in `backend/prisma/schema.prisma`:

- **User** — credentials, role, `creditsBalance`, unique `referralCode`, referral self-relation, bonus flags
- **Movie** — title, synopsis, genre, `price Decimal(10,2)`, poster, and trailer
- **Purchase** — movie purchase with `status` (PENDING/COMPLETED/FAILED), `provider`, unique `correlationId`, and the Stripe intent
- **PaymentAudit** — immutable trail with a denormalized snapshot (name, e-mail, title)
- **PaymentOutbox** / **CreditPurchaseOutbox** — outbox pattern with `attempts`, `nextAttemptAt`, and status
- **CreditPlan**, **CreditPurchase**, **CreditTransaction** (ledger with `balanceBefore`/`balanceAfter` and unique `(userId, correlationId)`), **CreditSystemConfig** (singleton id=1), **ReferralRewardLog**
- **ProcessedWebhookEvent** — durable webhook idempotency

Every repository has both a Prisma and a Firebase implementation; the choice is made at injection time by `repository-provider.factory.ts` reading `DATABASE_PROVIDER`.

## Security

- Helmet with configurable CSP, `frameAncestors 'none'`, HSTS 180 days
- CORS with credentials restricted to an explicit origin list
- Global `ValidationPipe` rejects unknown fields; `ParseUUIDPipe` on all `:id` routes
- Double-submit CSRF on cookie-authenticated mutations
- Global rate limiting (`RATE_LIMIT_*`)
- Hardened uploads: MIME allowlist + extension↔MIME cross-check, size limit, and random filenames
- Pino logs with correlation via `x-request-id`

> Version: 1.0.0
