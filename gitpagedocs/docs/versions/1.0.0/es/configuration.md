# Configuración

Plantillas de entorno: `envexample.txt` (local, copiar a `.env`) y `docs/deploy/.envexampledeploy.txt` (producción/Railway). La validación en `validatePlatformConfig()` se ejecuta en el arranque y falla temprano si la combinación es inválida.

## Matriz de proveedores

| Variable | Opciones (predeterminado en negrita) | Efecto |
|---|---|---|
| `DATABASE_PROVIDER` | **postgres**, firestore, realtime | Prisma/PostgreSQL o Firebase |
| `AUTH_MODE` (legado: `AUTH_PROVIDER`) | **local**, firebase, hybrid | Estrategia de autenticación |
| `MEDIA_STORAGE_PROVIDER` | **local**, firebase | Destino de los uploads |
| `PAYMENT_FLOW_MODE` | **rmq**, sync | Checkout asíncrono o inline |
| `PAYMENT_PROVIDER` | **mock**, stripe | Gateway de pago |

## Runtime y logs

| Variable | Descripción |
|---|---|
| `APP_ENV` | `local` habilita pino-pretty y relaja la validación de longitud de los secretos |
| `PORT` | Puerto del backend (predeterminado 3001) |
| `BACKEND_BASE_URL` | Base usada para construir las URLs públicas de upload |
| `LOG_LEVEL`, `APP_LOGGER_ENABLED` | Nivel de pino y activación/desactivación del `ApiLogger` |

## Autenticación y sesión

| Variable | Descripción |
|---|---|
| `JWT_SECRET`, `JWT_EXPIRATION` | Access token (predeterminado `1d`); mínimo 32 caracteres fuera de `local` |
| `AUTH_JWE_SECRET`, `AUTH_JWE_EXPIRATION` | Refresh token JWE (predeterminado `7d`) |
| `CSRF_ENABLED` | Activa la comprobación double-submit |
| `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_SAMESITE`, `AUTH_COOKIE_DOMAIN` | Atributos de las cookies (`samesite=none` exige `secure=true`) |
| `AUTH_ACCESS_COOKIE_MAX_AGE_MS`, `AUTH_REFRESH_COOKIE_MAX_AGE_MS` | Duración de las cookies |
| `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin del seed; `ADMIN_EMAIL` también autoriza el registro con rol ADMIN |

## Base de datos y Firebase

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión de Prisma |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Credenciales sueltas (`\n` se desescapa) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Alternativa: JSON crudo o base64 |
| `FIREBASE_DATABASE_URL`, `FIREBASE_STORAGE_BUCKET` | Realtime DB y Storage |
| `FIREBASE_STORAGE_PUBLIC` | URL pública vs. URL firmada |
| `FIREBASE_AUTH_EMULATOR_HOST` | Emulador (solo local) |

## RabbitMQ y pagos

| Variable | Predeterminado | Descripción |
|---|---|---|
| `RABBITMQ_URL` | — | Conexión AMQP |
| `RABBITMQ_PAYMENT_QUEUE`, `RABBITMQ_PAYMENT_DLQ` | — | Cola principal y DLQ |
| `RABBITMQ_PREFETCH` | 25 | Prefetch del consumidor |
| `RABBITMQ_PUBLISH_TIMEOUT_MS` | 5000 | Timeout de publicación |
| `PAYMENT_MAX_RETRIES` | 3 | Reintentos del worker |
| `PAYMENT_OUTBOX_BATCH_SIZE` | 25 | Lote del dispatcher |
| `PAYMENT_OUTBOX_MAX_ATTEMPTS` | 5 | Intentos del outbox |
| `PAYMENT_OUTBOX_DISPATCH_INTERVAL_MS` | 3000 | Intervalo del dispatcher |
| `PAYMENT_OUTBOX_RETRY_DELAY_MS` | 2000 | Base del backoff lineal |
| `CREDIT_PAYMENT_MAX_RETRIES`, `CREDIT_OUTBOX_*` | — | Equivalentes para créditos |

## Stripe

| Variable | Descripción |
|---|---|
| `STRIPE_SECRET_KEY` | Obligatoria con `PAYMENT_PROVIDER=stripe` |
| `STRIPE_WEBHOOK_SECRET` | Validación de la firma del webhook |
| `STRIPE_CURRENCY` | Predeterminado `brl` |
| `STRIPE_TEST_PAYMENT_METHOD` | Predeterminado `pm_card_visa` |

## CORS, CSP y rate limit

| Variable | Descripción |
|---|---|
| `CORS_ALLOWED_ORIGINS` | Lista de orígenes separados por comas |
| `NEXT_PUBLIC_FRONTEND_URL` | Origen del frontend |
| `CSP_ENABLED`, `CSP_REPORT_ONLY`, `CSP_CONNECT_SRC` | Content-Security-Policy |
| `RATE_LIMIT_PERMITS` (150), `RATE_LIMIT_WINDOW_MINUTES` (1), `RATE_LIMIT_QUEUE` (5) | Throttling global |

## Uploads

| Variable | Predeterminado | Descripción |
|---|---|---|
| `UPLOADS_DIR` | — | Directorio servido en `/uploads/` |
| `UPLOAD_MAX_FILE_SIZE_MB` | 10 | Tamaño máximo |
| `UPLOAD_ALLOWED_MIME_TYPES` | `image/jpeg,image/png,image/webp` | Allowlist de MIME |

## Paginación

`PAGINATION_DEFAULT_PAGE` (1), `PAGINATION_DEFAULT_LIMIT` (12), `PAGINATION_MAX_LIMIT` (50).

## Frontend

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base de la API (embebida en el build de Docker) |
| `NEXT_PUBLIC_START_THEME`, `START_THEME` | Tema inicial (claro/oscuro) |

## Validaciones de arranque

El backend se niega a iniciar cuando: faltan credenciales de Firebase con `DATABASE_PROVIDER` ≠ `postgres` o `MEDIA_STORAGE_PROVIDER=firebase`; falta `STRIPE_SECRET_KEY` con `PAYMENT_PROVIDER=stripe`; `JWT_SECRET`/`AUTH_JWE_SECRET` tienen menos de 32 caracteres fuera de `APP_ENV=local`; o `AUTH_COOKIE_SAMESITE=none` con `AUTH_COOKIE_SECURE=false` y CSRF activo.

> Versión: 1.0.0
