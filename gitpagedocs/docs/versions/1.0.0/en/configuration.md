# Configuration

Environment templates: `envexample.txt` (local, copy to `.env`) and `docs/deploy/.envexampledeploy.txt` (production/Railway). Validation in `validatePlatformConfig()` runs at boot and fails early if the combination is invalid.

## Provider matrix

| Variable | Options (default in bold) | Effect |
|---|---|---|
| `DATABASE_PROVIDER` | **postgres**, firestore, realtime | Prisma/PostgreSQL or Firebase |
| `AUTH_MODE` (legacy: `AUTH_PROVIDER`) | **local**, firebase, hybrid | Authentication strategy |
| `MEDIA_STORAGE_PROVIDER` | **local**, firebase | Upload destination |
| `PAYMENT_FLOW_MODE` | **rmq**, sync | Asynchronous or inline checkout |
| `PAYMENT_PROVIDER` | **mock**, stripe | Payment gateway |

## Runtime and logs

| Variable | Description |
|---|---|
| `APP_ENV` | `local` enables pino-pretty and relaxes secret-length validation |
| `PORT` | Backend port (default 3001) |
| `BACKEND_BASE_URL` | Base used to build public upload URLs |
| `LOG_LEVEL`, `APP_LOGGER_ENABLED` | Pino level and `ApiLogger` on/off switch |

## Authentication and session

| Variable | Description |
|---|---|
| `JWT_SECRET`, `JWT_EXPIRATION` | Access token (default `1d`); minimum 32 chars outside `local` |
| `AUTH_JWE_SECRET`, `AUTH_JWE_EXPIRATION` | JWE refresh token (default `7d`) |
| `CSRF_ENABLED` | Enables the double-submit check |
| `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_SAMESITE`, `AUTH_COOKIE_DOMAIN` | Cookie attributes (`samesite=none` requires `secure=true`) |
| `AUTH_ACCESS_COOKIE_MAX_AGE_MS`, `AUTH_REFRESH_COOKIE_MAX_AGE_MS` | Cookie lifetimes |
| `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seed admin; `ADMIN_EMAIL` also authorizes registration with the ADMIN role |

## Database and Firebase

| Variable | Description |
|---|---|
| `DATABASE_URL` | Prisma connection string |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Individual credentials (`\n` is unescaped) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Alternative: raw JSON or base64 |
| `FIREBASE_DATABASE_URL`, `FIREBASE_STORAGE_BUCKET` | Realtime DB and Storage |
| `FIREBASE_STORAGE_PUBLIC` | Public URL vs. signed URL |
| `FIREBASE_AUTH_EMULATOR_HOST` | Emulator (local only) |

## RabbitMQ and payments

| Variable | Default | Description |
|---|---|---|
| `RABBITMQ_URL` | — | AMQP connection |
| `RABBITMQ_PAYMENT_QUEUE`, `RABBITMQ_PAYMENT_DLQ` | — | Main queue and DLQ |
| `RABBITMQ_PREFETCH` | 25 | Consumer prefetch |
| `RABBITMQ_PUBLISH_TIMEOUT_MS` | 5000 | Publish timeout |
| `PAYMENT_MAX_RETRIES` | 3 | Worker attempts |
| `PAYMENT_OUTBOX_BATCH_SIZE` | 25 | Dispatcher batch size |
| `PAYMENT_OUTBOX_MAX_ATTEMPTS` | 5 | Outbox attempts |
| `PAYMENT_OUTBOX_DISPATCH_INTERVAL_MS` | 3000 | Dispatcher interval |
| `PAYMENT_OUTBOX_RETRY_DELAY_MS` | 2000 | Linear backoff base |
| `CREDIT_PAYMENT_MAX_RETRIES`, `CREDIT_OUTBOX_*` | — | Credit-flow equivalents |

## Stripe

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Required with `PAYMENT_PROVIDER=stripe` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature validation |
| `STRIPE_CURRENCY` | Default `brl` |
| `STRIPE_TEST_PAYMENT_METHOD` | Default `pm_card_visa` |

## CORS, CSP, and rate limiting

| Variable | Description |
|---|---|
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of origins |
| `NEXT_PUBLIC_FRONTEND_URL` | Frontend origin |
| `CSP_ENABLED`, `CSP_REPORT_ONLY`, `CSP_CONNECT_SRC` | Content-Security-Policy |
| `RATE_LIMIT_PERMITS` (150), `RATE_LIMIT_WINDOW_MINUTES` (1), `RATE_LIMIT_QUEUE` (5) | Global throttling |

## Uploads

| Variable | Default | Description |
|---|---|---|
| `UPLOADS_DIR` | — | Directory served at `/uploads/` |
| `UPLOAD_MAX_FILE_SIZE_MB` | 10 | Maximum size |
| `UPLOAD_ALLOWED_MIME_TYPES` | `image/jpeg,image/png,image/webp` | MIME allowlist |

## Pagination

`PAGINATION_DEFAULT_PAGE` (1), `PAGINATION_DEFAULT_LIMIT` (12), `PAGINATION_MAX_LIMIT` (50).

## Frontend

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | API base (baked into the Docker build) |
| `NEXT_PUBLIC_START_THEME`, `START_THEME` | Initial theme (light/dark) |

## Boot validations

The backend refuses to start when: Firebase credentials are missing with `DATABASE_PROVIDER` ≠ `postgres` or `MEDIA_STORAGE_PROVIDER=firebase`; `STRIPE_SECRET_KEY` is missing with `PAYMENT_PROVIDER=stripe`; `JWT_SECRET`/`AUTH_JWE_SECRET` are shorter than 32 characters outside `APP_ENV=local`; or `AUTH_COOKIE_SAMESITE=none` with `AUTH_COOKIE_SECURE=false` and CSRF enabled.

> Version: 1.0.0
