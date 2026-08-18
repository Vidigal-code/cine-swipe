# Pagos y créditos

CineSwipe tiene dos flujos de cobro que comparten la misma infraestructura: compra de **películas** y compra de **planes de créditos**. Ambos soportan modo asíncrono (outbox + RabbitMQ) y síncrono, y gateway `mock` o `stripe`.

## Flujo de compra de película

1. `POST /payments/checkout` con `{movieId}` genera un `correlationId` (UUID) y resuelve el proveedor (`PAYMENT_PROVIDER`).
2. **Modo `rmq`** (predeterminado): la `Purchase` (PENDING) y la fila de outbox se escriben **en la misma transacción**; la API responde de inmediato. **Modo `sync`**: el gateway se llama inline y la respuesta ya llega COMPLETED o FAILED.
3. Cada paso escribe una fila de auditoría en `payment_audits`.

### Outbox dispatcher

`presentation/workers/payment-outbox.dispatcher.ts` se ejecuta a intervalos (`PAYMENT_OUTBOX_DISPATCH_INTERVAL_MS`, predeterminado 3000 ms), publica lotes (`PAYMENT_OUTBOX_BATCH_SIZE`) en la cola con timeout y los marca como SENT. En caso de fallo, incrementa `attempts` con backoff lineal (`PAYMENT_OUTBOX_RETRY_DELAY_MS × attempts`) hasta `PAYMENT_OUTBOX_MAX_ATTEMPTS`; superado el límite, emite `checkout.failed` hacia la DLQ.

### Worker de pago

`payment.worker.ts` consume `checkout.requested` con ack manual, ignora compras que no están PENDING, llama al gateway y, en caso de rechazo, reencola hasta `PAYMENT_MAX_RETRIES` (predeterminado 3) antes de marcar FAILED y mover a la DLQ.

## Gateways

- **Mock** (predeterminado): espera 1,5 s y aprueba siempre — ideal para desarrollo.
- **Stripe**: `paymentIntents.create` con `confirm: true`, método de prueba `STRIPE_TEST_PAYMENT_METHOD` (predeterminado `pm_card_visa`), importe en centavos, `idempotencyKey = correlationId` y metadata `{purchaseId, correlationId, purchaseKind}`.

## Webhook de Stripe

`POST /payments/webhook/stripe` (sin guard) valida la firma con `STRIPE_WEBHOOK_SECRET` usando el `rawBody`. El tratamiento:

1. Consulta `processed_webhook_events`; un evento duplicado genera la auditoría `WEBHOOK_DUPLICATE_IGNORED` y retorna.
2. Trata `payment_intent.succeeded` y `payment_intent.payment_failed`.
3. Enruta hacia el flujo de créditos cuando `metadata.purchaseKind === 'credit'`.
4. Marca el evento como procesado (`eventId` único).

Idempotencia en tres capas: `idempotencyKey` en Stripe, tabla de eventos procesados y la constraint única `(userId, correlationId)` en el ledger.

## Auditoría

Toda transición genera una fila inmutable en `payment_audits` con snapshot (nombre del usuario, e-mail, título de la película), `eventType` (`CHECKOUT_REQUESTED`, `STATUS_UPDATED`, `RETRY_SCHEDULED`, `DLQ_MOVED`, `WEBHOOK_DUPLICATE_IGNORED`) y `source` (`API`, `WORKER`, `WEBHOOK`, `SYSTEM`). Los admins la visualizan en `/admin/audit`.

## Sistema de créditos

- **Planes**: administrados en `/admin/credits` (nombre, cantidad, precio en BRL, activo). El seed crea Bronce 300/R$ 19,90, Plata 800/R$ 44,90 y Oro 1800/R$ 89,90.
- **Compra**: `POST /credits/checkout` refleja el flujo de películas (outbox + cola propia de créditos, con variables `CREDIT_OUTBOX_*`).
- **Aprobación**: el status pasa a COMPLETED y el saldo se acredita vía ledger con correlación `credit-purchase:<id>`; a continuación se ejecuta la recompensa de referido.
- **Ledger**: `adjustUserCredits()` se ejecuta en una transacción — si ya existe una transacción con el mismo `(userId, correlationId)`, retorna sin duplicar; calcula `balanceBefore`/`balanceAfter`, lanza `INSUFFICIENT_CREDITS` si quedaría negativo y actualiza `User.creditsBalance`.
- **Consumo**: `POST /credits/consume` hace un ajuste negativo; el saldo insuficiente se convierte en HTTP 400 con mensaje en pt-BR, mostrado en el frontend como popup de aviso.
- **Bono de registro**: todo usuario nuevo recibe `registrationBonusCredits` (predeterminado 250) con correlación `registration:<userId>:base`.

## Referidos (referral)

Cada usuario tiene un `referralCode` único (`ref_` + 6 bytes hex). Con `referralEnabled`:

- **Bono del referido** — al registrarse con un código válido, el nuevo usuario gana `refereeRegistrationBonusCredits` (una sola vez, registrado en `ReferralRewardLog`). La autorreferencia es rechazada.
- **Bono del referidor** — en la **primera compra de créditos aprobada** del referido, el referidor gana `referrerFirstPurchaseBonusCredits`. La flag `firstApprovedCreditPurchaseDone` se activa atómicamente, garantizando una recompensa única.

Constraints únicas en `referral_reward_logs` garantizan como máximo una recompensa por tipo por par referidor/referido.

## Observación

Comprar una **película** no gasta créditos — el checkout de película cobra el precio en BRL a través del gateway. La cartera de créditos es independiente, y hoy su único punto de consumo es el endpoint genérico `/credits/consume` (usado por la simulación en la pantalla de créditos).

> Versión: 1.0.0
