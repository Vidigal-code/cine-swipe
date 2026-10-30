# Pagos y créditos

Catálogo de películas con autenticación, perfil, administración, compras, cartera de créditos y referidos. Comprar una película cobra su precio monetario; no descuenta créditos. Estos tienen checkout y consumo propios. Distinga modos mock y Stripe al interpretar compras aprobadas.

## Flujo y casos de fallo

1. Registro/login valida credenciales locales o token Firebase y crea sesión. Cookies de acceso/refresh son HttpOnly; CSRF es legible por el cliente y acompaña x-csrf-token cuando está habilitado. Refresh, logout, contraseña/perfil y avatar tienen endpoints propios. Lista/detalle alimentan navegación y checkout.

2. POST /payments/checkout recibe movieId y crea correlationId. En rmq, el repositorio crea Purchase PENDING y outbox; Prisma guarda ambos en transacción. Dispatcher publica checkout.requested; worker llama al gateway, actualiza COMPLETED/FAILED y audita. Timeout, intentos y DLQ son configurables. En sync el gateway se ejecuta durante la petición.

3. El webhook /payments/webhook/stripe valida firma con cuerpo bruto y STRIPE_WEBHOOK_SECRET. Reconoce eventos procesados; payment_intent.succeeded/failed actualizan compras. purchaseKind dirige créditos. correlationId aporta idempotencia al gateway; eventos procesados y ledger añaden controles. No asuma atomicidad equivalente a Prisma en otros adaptadores.

4. Planes → /credits/checkout → outbox/worker propios → aprobación → ledger y saldo. /credits/consume debita y rechaza saldo insuficiente. Registro puede otorgar bonos base/referido. La primera compra aprobada del referido puede recompensar al referente; configuración, correlaciones y logs evitan repetir el beneficio previsto. Admins gestionan usuarios, planes/configuración y auditoría.

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
