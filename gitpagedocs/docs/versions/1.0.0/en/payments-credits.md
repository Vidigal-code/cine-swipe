# Payments and credits

CineSwipe has two billing flows that share the same infrastructure: **movie** purchases and **credit plan** purchases. Both support asynchronous (outbox + RabbitMQ) and synchronous modes, and either the `mock` or `stripe` gateway.

## Movie purchase flow

1. `POST /payments/checkout` with `{movieId}` generates a `correlationId` (UUID) and resolves the provider (`PAYMENT_PROVIDER`).
2. **`rmq` mode** (default): the `Purchase` (PENDING) and the outbox row are written **in the same transaction**; the API responds immediately. **`sync` mode**: the gateway is called inline and the response already comes back COMPLETED or FAILED.
3. Every step writes an audit row to `payment_audits`.

### Outbox dispatcher

`presentation/workers/payment-outbox.dispatcher.ts` runs on an interval (`PAYMENT_OUTBOX_DISPATCH_INTERVAL_MS`, default 3000 ms), publishes batches (`PAYMENT_OUTBOX_BATCH_SIZE`) to the queue with a timeout, and marks them as SENT. On failure, it increments `attempts` with linear backoff (`PAYMENT_OUTBOX_RETRY_DELAY_MS × attempts`) up to `PAYMENT_OUTBOX_MAX_ATTEMPTS`; once the limit is exceeded, it emits `checkout.failed` to the DLQ.

### Payment worker

`payment.worker.ts` consumes `checkout.requested` with manual ack, ignores purchases that are not PENDING, calls the gateway, and, on decline, requeues up to `PAYMENT_MAX_RETRIES` (default 3) before marking the purchase FAILED and moving it to the DLQ.

## Gateways

- **Mock** (default): waits 1.5 s and always approves — ideal for development.
- **Stripe**: `paymentIntents.create` with `confirm: true`, test method `STRIPE_TEST_PAYMENT_METHOD` (default `pm_card_visa`), amount in cents, `idempotencyKey = correlationId`, and metadata `{purchaseId, correlationId, purchaseKind}`.

## Stripe webhook

`POST /payments/webhook/stripe` (no guard) validates the signature with `STRIPE_WEBHOOK_SECRET` using the `rawBody`. Handling:

1. Checks `processed_webhook_events`; a duplicate event produces a `WEBHOOK_DUPLICATE_IGNORED` audit entry and returns.
2. Handles `payment_intent.succeeded` and `payment_intent.payment_failed`.
3. Routes to the credit flow when `metadata.purchaseKind === 'credit'`.
4. Marks the event as processed (unique `eventId`).

Three-layer idempotency: `idempotencyKey` on Stripe, the processed-events table, and the unique `(userId, correlationId)` constraint on the ledger.

## Auditing

Every transition produces an immutable row in `payment_audits` with a snapshot (user name, e-mail, movie title), `eventType` (`CHECKOUT_REQUESTED`, `STATUS_UPDATED`, `RETRY_SCHEDULED`, `DLQ_MOVED`, `WEBHOOK_DUPLICATE_IGNORED`), and `source` (`API`, `WORKER`, `WEBHOOK`, `SYSTEM`). Admins view it at `/admin/audit`.

## Credit system

- **Plans**: managed at `/admin/credits` (name, amount, price in BRL, active). The seed creates Bronze 300/R$19.90, Prata 800/R$44.90, and Ouro 1800/R$89.90.
- **Purchase**: `POST /credits/checkout` mirrors the movie flow (outbox + its own credit queue, with `CREDIT_OUTBOX_*` variables).
- **Approval**: the status becomes COMPLETED and the balance is credited via the ledger with correlation `credit-purchase:<id>`; the referral reward then runs.
- **Ledger**: `adjustUserCredits()` runs in a transaction — if a transaction with the same `(userId, correlationId)` already exists, it returns without duplicating; it computes `balanceBefore`/`balanceAfter`, throws `INSUFFICIENT_CREDITS` if the balance would go negative, and updates `User.creditsBalance`.
- **Consumption**: `POST /credits/consume` makes a negative adjustment; an insufficient balance becomes HTTP 400 with a pt-BR message, shown on the frontend as a warning popup.
- **Sign-up bonus**: every new user receives `registrationBonusCredits` (default 250) with correlation `registration:<userId>:base`.

## Referrals

Every user has a unique `referralCode` (`ref_` + 6 hex bytes). With `referralEnabled`:

- **Referred-user bonus** — on registration with a valid code, the new user earns `refereeRegistrationBonusCredits` (once, recorded in `ReferralRewardLog`). Self-referral is rejected.
- **Referrer bonus** — on the referred user's **first approved credit purchase**, the referrer earns `referrerFirstPurchaseBonusCredits`. The `firstApprovedCreditPurchaseDone` flag is flipped atomically, guaranteeing a single reward.

Unique constraints on `referral_reward_logs` guarantee at most one reward per type per referrer/referred pair.

## Note

Buying a **movie** does not spend credits — the movie checkout charges the price in BRL through the gateway. The credit wallet is separate, and today its only consumption point is the generic `/credits/consume` endpoint (used by the simulation on the credits screen).

> Version: 1.0.0
