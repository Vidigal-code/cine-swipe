# Backend y API

API NestJS 11 con Prisma 6 sobre PostgreSQL, mensajería RabbitMQ y capas inspiradas en Clean Architecture (`domain` → `application` → `infrastructure` / `presentation`).

## Bootstrap

`backend/src/main.ts` inicializa con `rawBody: true` (necesario para la firma de Stripe), logger pino, validación de configuración (`validatePlatformConfig()`), `cookie-parser`, helmet con CSP dirigida por el entorno, CORS con credenciales, `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`) y assets estáticos en `/uploads/`. Cuando `PAYMENT_FLOW_MODE=rmq`, conecta además un microservicio RabbitMQ (cola durable, DLX hacia la DLQ, `noAck: false`, prefetch configurable).

Guards globales: `ThrottlerGuard` (rate limit) y `RolesGuard` (RBAC por metadata `@Roles`).

## Endpoints

### Autenticación — `/auth`

| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| POST | `/auth/register` | — | Registro (con código de referido opcional); establece 3 cookies |
| POST | `/auth/login` | — | Login local o con `firebaseIdToken` |
| POST | `/auth/refresh` | — | Renueva la sesión (comprobación manual de CSRF) |
| GET | `/auth/me` | JWT | Usuario actual |
| POST | `/auth/logout` | JWT | Limpia las cookies |
| PUT | `/auth/profile` | JWT | Actualiza nombre/e-mail |
| PUT | `/auth/password` | JWT | Cambio de contraseña (política fuerte + bcrypt) |
| POST | `/auth/avatar/upload` | JWT | Upload de avatar (multipart) |

### Películas — `/movies`

| Método | Ruta | Guard |
|---|---|---|
| GET | `/movies` | Público (paginado) |
| GET | `/movies/:id` | Público |
| POST | `/movies` | JWT + ADMIN |
| POST | `/movies/upload` | JWT + ADMIN (póster) |
| PUT | `/movies/:id` | JWT + ADMIN |
| DELETE | `/movies/:id` | JWT + ADMIN |

### Pagos — `/payments`

| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| POST | `/payments/checkout` | JWT | Inicia la compra de una película (`{movieId}`) |
| GET | `/payments/my-movies` | JWT | Compras COMPLETED paginadas |
| GET | `/payments/admin/audits` | JWT + ADMIN | Registro de auditoría |
| POST | `/payments/webhook/stripe` | Firma de Stripe | Webhook (sin guard; valida `stripe-signature`) |

### Créditos — `/credits` y `/admin/credits`

| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| GET | `/credits/balance` | JWT | Saldo actual |
| GET | `/credits/plans` | JWT | Planes activos |
| GET | `/credits/history` | JWT | Extracto (ledger) |
| GET | `/credits/purchases` | JWT | Compras de créditos |
| POST | `/credits/checkout` | JWT | Compra de plan (`{creditPlanId}`) |
| POST | `/credits/consume` | JWT | Consumo (`{amount, description, correlationId?}`) |
| GET/POST | `/admin/credits/plans` | JWT + ADMIN | Listar/crear planes |
| PATCH/DELETE | `/admin/credits/plans/:id` | JWT + ADMIN | Editar/eliminar plan |
| GET/PATCH | `/admin/credits/config` | JWT + ADMIN | Configuración global |

### Usuarios (admin) — `/admin/users`

CRUD completo: `GET`, `POST`, `PATCH /:id`, `PATCH /:id/role`, `DELETE /:id`. Reglas de seguridad: no puede eliminarse a sí mismo, no puede cambiar su propio rol y no puede degradar/eliminar al último ADMIN.

### Salud

`GET /health` → `{status: "ok"}`.

## Autenticación y sesión

Tres modos vía `AUTH_MODE`: `local`, `firebase` y `hybrid` (la presencia de `firebaseIdToken` elige el camino Firebase). Sesión en 3 cookies:

- `cine_access_token` — JWT firmado (`JWT_SECRET`, expiración predeterminada 1d), HttpOnly
- `cine_refresh_token` — JWE (`jose`, A256GCM, clave = SHA-256 de `AUTH_JWE_SECRET`, predeterminado 7d), HttpOnly
- `cine_csrf_token` — token aleatorio, legible por JS (patrón double-submit)

El `JwtAuthGuard` lee primero la cookie y recurre a `Authorization: Bearer`; cuando el token proviene de una cookie y el método es una mutación, exige `x-csrf-token` igual a la cookie. La escalada de rol está bloqueada: solicitar `ADMIN` en el registro solo funciona si el e-mail es igual a `ADMIN_EMAIL`.

Política de contraseñas: 8–64 caracteres con minúscula, mayúscula, dígito y símbolo; hash bcrypt (costo 10).

## Modelo de datos (Prisma)

Principales modelos en `backend/prisma/schema.prisma`:

- **User** — credenciales, rol, `creditsBalance`, `referralCode` único, autorrelación de referidos, flags de bonos
- **Movie** — título, sinopsis, género, `price Decimal(10,2)`, póster y tráiler
- **Purchase** — compra de película con `status` (PENDING/COMPLETED/FAILED), `provider`, `correlationId` único e intent de Stripe
- **PaymentAudit** — registro inmutable con snapshot desnormalizado (nombre, e-mail, título)
- **PaymentOutbox** / **CreditPurchaseOutbox** — patrón outbox con `attempts`, `nextAttemptAt` y status
- **CreditPlan**, **CreditPurchase**, **CreditTransaction** (ledger con `balanceBefore`/`balanceAfter` y unique `(userId, correlationId)`), **CreditSystemConfig** (singleton id=1), **ReferralRewardLog**
- **ProcessedWebhookEvent** — idempotencia durable de webhooks

Cada repositorio tiene implementación Prisma y Firebase; la elección se hace en tiempo de inyección por `repository-provider.factory.ts` leyendo `DATABASE_PROVIDER`.

## Seguridad

- Helmet con CSP configurable, `frameAncestors 'none'`, HSTS 180 días
- CORS con credenciales restringido a una lista explícita de orígenes
- `ValidationPipe` global rechaza campos desconocidos; `ParseUUIDPipe` en todas las rutas `:id`
- CSRF double-submit en mutaciones autenticadas por cookie
- Rate limit global (`RATE_LIMIT_*`)
- Upload endurecido: allowlist de MIME + comprobación cruzada extensión↔MIME, límite de tamaño y nombres aleatorios
- Logs pino con correlación por `x-request-id`

> Versión: 1.0.0
