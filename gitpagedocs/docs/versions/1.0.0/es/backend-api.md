# Backend y API

Catálogo de películas con autenticación, perfil, administración, compras, cartera de créditos y referidos. Comprar una película cobra su precio monetario; no descuenta créditos. Estos tienen checkout y consumo propios. Distinga modos mock y Stripe al interpretar compras aprobadas.

## Flujo y casos de fallo

1. Registro/login valida credenciales locales o token Firebase y crea sesión. Cookies de acceso/refresh son HttpOnly; CSRF es legible por el cliente y acompaña x-csrf-token cuando está habilitado. Refresh, logout, contraseña/perfil y avatar tienen endpoints propios. Lista/detalle alimentan navegación y checkout.

2. POST /payments/checkout recibe movieId y crea correlationId. En rmq, el repositorio crea Purchase PENDING y outbox; Prisma guarda ambos en transacción. Dispatcher publica checkout.requested; worker llama al gateway, actualiza COMPLETED/FAILED y audita. Timeout, intentos y DLQ son configurables. En sync el gateway se ejecuta durante la petición.

3. El webhook /payments/webhook/stripe valida firma con cuerpo bruto y STRIPE_WEBHOOK_SECRET. Reconoce eventos procesados; payment_intent.succeeded/failed actualizan compras. purchaseKind dirige créditos. correlationId aporta idempotencia al gateway; eventos procesados y ledger añaden controles. No asuma atomicidad equivalente a Prisma en otros adaptadores.

4. Planes → /credits/checkout → outbox/worker propios → aprobación → ledger y saldo. /credits/consume debita y rechaza saldo insuficiente. Registro puede otorgar bonos base/referido. La primera compra aprobada del referido puede recompensar al referente; configuración, correlaciones y logs evitan repetir el beneficio previsto. Admins gestionan usuarios, planes/configuración y auditoría.

| Método y ruta | Declaración |
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

## Ejemplo de petición

```http
POST /payments/checkout HTTP/1.1
Cookie: <authenticated-session-cookies>
x-csrf-token: <csrf-token>
Content-Type: application/json

{"movieId":"<existing-movie-id>"}
```

## Archivos relacionados

- [backend/src/application/payment/payment.service.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/application/payment/payment.service.ts)
- [backend/src/application/credit/credit.service.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/application/credit/credit.service.ts)
- [backend/src/presentation/workers/payment-outbox.dispatcher.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/workers/payment-outbox.dispatcher.ts)
- [backend/src/presentation/workers/payment.worker.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/workers/payment.worker.ts)
- [backend/src/shared/config/platform.config.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/shared/config/platform.config.ts)
- [backend/prisma/schema.prisma](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/prisma/schema.prisma)
- [docker-compose.yml](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/docker-compose.yml)

## Navegación

- [Project guide](?menu=es&lang=es&id=9)
- [Source reference](?menu=es&lang=es&id=10)
