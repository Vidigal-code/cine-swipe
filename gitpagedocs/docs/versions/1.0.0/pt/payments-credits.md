# Pagamentos e créditos

O CineSwipe tem dois fluxos de cobrança que compartilham a mesma infraestrutura: compra de **filmes** e compra de **planos de créditos**. Ambos suportam modo assíncrono (outbox + RabbitMQ) e síncrono, e gateway `mock` ou `stripe`.

## Fluxo de compra de filme

1. `POST /payments/checkout` com `{movieId}` gera um `correlationId` (UUID) e resolve o provedor (`PAYMENT_PROVIDER`).
2. **Modo `rmq`** (padrão): `Purchase` (PENDING) e a linha de outbox são gravados **na mesma transação**; a API responde imediatamente. **Modo `sync`**: o gateway é chamado inline e a resposta já vem COMPLETED ou FAILED.
3. Cada passo grava uma linha de auditoria em `payment_audits`.

### Outbox dispatcher

`presentation/workers/payment-outbox.dispatcher.ts` roda em intervalo (`PAYMENT_OUTBOX_DISPATCH_INTERVAL_MS`, padrão 3000 ms), publica lotes (`PAYMENT_OUTBOX_BATCH_SIZE`) na fila com timeout e marca como SENT. Em falha, incrementa `attempts` com backoff linear (`PAYMENT_OUTBOX_RETRY_DELAY_MS × attempts`) até `PAYMENT_OUTBOX_MAX_ATTEMPTS`; estourado o limite, emite `checkout.failed` para a DLQ.

### Worker de pagamento

`payment.worker.ts` consome `checkout.requested` com ack manual, ignora compras que não estão PENDING, chama o gateway e, em recusa, reenfileira até `PAYMENT_MAX_RETRIES` (padrão 3) antes de marcar FAILED e mover para a DLQ.

## Gateways

- **Mock** (padrão): aguarda 1,5 s e aprova sempre — ideal para desenvolvimento.
- **Stripe**: `paymentIntents.create` com `confirm: true`, método de teste `STRIPE_TEST_PAYMENT_METHOD` (padrão `pm_card_visa`), valor em centavos, `idempotencyKey = correlationId` e metadata `{purchaseId, correlationId, purchaseKind}`.

## Webhook do Stripe

`POST /payments/webhook/stripe` (sem guard) valida a assinatura com `STRIPE_WEBHOOK_SECRET` usando o `rawBody`. O tratamento:

1. Consulta `processed_webhook_events`; evento duplicado gera auditoria `WEBHOOK_DUPLICATE_IGNORED` e retorna.
2. Trata `payment_intent.succeeded` e `payment_intent.payment_failed`.
3. Roteia para o fluxo de créditos quando `metadata.purchaseKind === 'credit'`.
4. Marca o evento como processado (`eventId` único).

Idempotência em três camadas: `idempotencyKey` no Stripe, tabela de eventos processados e a constraint única `(userId, correlationId)` no ledger.

## Auditoria

Toda transição gera uma linha imutável em `payment_audits` com snapshot (nome do usuário, e-mail, título do filme), `eventType` (`CHECKOUT_REQUESTED`, `STATUS_UPDATED`, `RETRY_SCHEDULED`, `DLQ_MOVED`, `WEBHOOK_DUPLICATE_IGNORED`) e `source` (`API`, `WORKER`, `WEBHOOK`, `SYSTEM`). Admins visualizam em `/admin/audit`.

## Sistema de créditos

- **Planos**: administrados em `/admin/credits` (nome, quantidade, preço em BRL, ativo). O seed cria Bronze 300/R$ 19,90, Prata 800/R$ 44,90 e Ouro 1800/R$ 89,90.
- **Compra**: `POST /credits/checkout` espelha o fluxo de filmes (outbox + fila própria de créditos, com variáveis `CREDIT_OUTBOX_*`).
- **Aprovação**: status vira COMPLETED e o saldo é creditado via ledger com correlação `credit-purchase:<id>`; em seguida roda a recompensa de indicação.
- **Ledger**: `adjustUserCredits()` roda em transação — se já existe transação com o mesmo `(userId, correlationId)`, retorna sem duplicar; calcula `balanceBefore`/`balanceAfter`, lança `INSUFFICIENT_CREDITS` se ficaria negativo e atualiza `User.creditsBalance`.
- **Consumo**: `POST /credits/consume` faz um ajuste negativo; saldo insuficiente vira HTTP 400 com mensagem em pt-BR, exibida no frontend como popup de aviso.
- **Bônus de cadastro**: todo usuário novo recebe `registrationBonusCredits` (padrão 250) com correlação `registration:<userId>:base`.

## Indicações (referral)

Cada usuário tem um `referralCode` único (`ref_` + 6 bytes hex). Com `referralEnabled`:

- **Bônus do indicado** — no cadastro com código válido, o novo usuário ganha `refereeRegistrationBonusCredits` (uma vez, registrado em `ReferralRewardLog`). Autoindicação é rejeitada.
- **Bônus do indicador** — na **primeira compra de créditos aprovada** do indicado, o indicador ganha `referrerFirstPurchaseBonusCredits`. A flag `firstApprovedCreditPurchaseDone` é virada atomicamente, garantindo recompensa única.

Constraints únicas em `referral_reward_logs` garantem no máximo uma recompensa por tipo por par indicador/indicado.

## Observação

Comprar um **filme** não gasta créditos — o checkout de filme cobra o preço em BRL pelo gateway. A carteira de créditos é separada, e hoje seu único ponto de consumo é o endpoint genérico `/credits/consume` (usado pela simulação na tela de créditos).

> Versão: 1.0.0
