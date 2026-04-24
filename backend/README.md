# Backend - Cine-Swipe

## 🇧🇷 Descrição em Português
<details>
<summary><strong>Ver Detalhes</strong></summary>

### Visão geral

Backend NestJS com arquitetura em camadas (DDD + SOLID + Clean Code), Prisma no acesso a dados e fluxo de pagamento assíncrono com outbox + RabbitMQ + worker.

### Principais responsabilidades

- Autenticação e autorização com JWT/JWE.
- Sessão segura por cookies HttpOnly (access/refresh) + proteção CSRF.
- RBAC para perfis `ADMIN` e `USER`.
- CRUD de filmes (admin) e biblioteca de filmes comprados.
- Sistema completo de créditos (saldo, ledger, compra por plano e indicação mista).
- Perfil do usuário (atualização de dados, troca de senha forte e upload de avatar).
- Administração de créditos (CRUD de planos + configuração global de bônus/indicação).
- Upload validado por tipo/tamanho.
- Pagamento assíncrono com suporte `mock` e Stripe real com webhook assinado.
- Matriz de providers por configuração (Postgres/Firestore/Realtime, Auth local/Firebase/híbrida, Storage local/Firebase, Stripe sync/RMQ).
- Logs centralizados com `nestjs-pino` e `ApiLogger`.

### Estrutura de camadas

- `src/domain`: entidades e contratos de repositório.
- `src/application`: regras de negócio e casos de uso.
- `src/infrastructure`: Prisma, gateways, mensageria e auth providers.
- `src/presentation`: controllers HTTP e workers RMQ.
- `src/shared`: componentes transversais reutilizáveis.

### Segurança enterprise implementada

- Helmet com CSP por ambiente (`CSP_ENABLED`, `CSP_REPORT_ONLY`, `CSP_CONNECT_SRC`).
- CORS com credenciais para fluxo baseado em cookie.
- DTOs com `class-validator`/`class-transformer`.
- Guard JWT com leitura de cookie e fallback em header.
- CSRF por double-submit token (`cine_csrf_token` + header `x-csrf-token`).
- Rate limiting global.

### Pagamento profissional implementado

- Checkout salva compra + evento em outbox na mesma transação.
- Dispatcher publica eventos pendentes com timeout e retries.
- Worker processa em fila assíncrona com retry progressivo.
- Estratégia DLQ para falhas finais (`RABBITMQ_PAYMENT_DLQ`).
- Webhook Stripe assinado (`/payments/webhook/stripe`) para confirmação oficial.
- Fluxo paralelo para créditos: `credit_purchase_outbox` + `CreditOutboxDispatcher` + `CreditPaymentWorker` (evento `credit.checkout.requested`).
- Idempotência persistente de webhook Stripe com armazenamento durável de eventos processados.

### Matriz de providers (sem hardcode)

- Banco de dados: `DATABASE_PROVIDER=postgres|firestore|realtime`
- Autenticação: `AUTH_MODE=local|firebase|hybrid`
- Mídia (avatar/pôster): `MEDIA_STORAGE_PROVIDER=local|firebase`
- Pagamento: `PAYMENT_PROVIDER=mock|stripe`
- Transporte do checkout Stripe: `PAYMENT_FLOW_MODE=rmq|sync`

### Rodar local (sem Docker)

1. `npm install`
2. `npm run prisma:generate`
3. `npm run prisma:migrate:deploy`
4. `npm run start:dev`

### Rodar com Docker (recomendado)

Na raiz do projeto:

- `docker-compose up --build`

No backend em produção local:

- `npm run start:prod:migrate`

### Variáveis principais (`/.env`)

- Runtime: `APP_ENV`, `PORT`, `APP_LOGGER_ENABLED`.
- CORS/CSP: `CORS_ALLOWED_ORIGINS`, `NEXT_PUBLIC_FRONTEND_URL`, `CSP_*`.
- Upload: `UPLOADS_DIR`, `UPLOAD_MAX_FILE_SIZE_MB`, `UPLOAD_ALLOWED_MIME_TYPES`.
- Auth: `JWT_*`, `AUTH_JWE_*`, `AUTH_COOKIE_*`, `CSRF_ENABLED`, `AUTH_MODE`, `AUTH_PROVIDER` (compat legado), `FIREBASE_*`.
- Mensageria: `RABBITMQ_URL`, `RABBITMQ_PAYMENT_QUEUE`, `RABBITMQ_PAYMENT_DLQ`, `RABBITMQ_PREFETCH`.
- Pagamento: `PAYMENT_PROVIDER`, `PAYMENT_FLOW_MODE`, `PAYMENT_MAX_RETRIES`, `PAYMENT_OUTBOX_*`, `STRIPE_*`.
- Banco/CDN Firebase: `DATABASE_PROVIDER`, `MEDIA_STORAGE_PROVIDER`, `FIREBASE_DATABASE_URL`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_STORAGE_PUBLIC`, `FIREBASE_AUTH_EMULATOR_HOST`.
- Créditos: `CREDIT_PAYMENT_MAX_RETRIES`, `CREDIT_OUTBOX_*`.
- Referência pronta para bootstrap local: `/envexample.txt`.
- Para execução local, copie/renomeie `envexample.txt` para `.env` na raiz do projeto.

### Perfis recomendados de execução

- Simulado (rápido/local):
  - `DATABASE_PROVIDER=postgres`
  - `AUTH_MODE=local`
  - `MEDIA_STORAGE_PROVIDER=local`
  - `PAYMENT_PROVIDER=mock`
  - `PAYMENT_FLOW_MODE=rmq`
- Híbrido Firebase + Stripe:
  - `DATABASE_PROVIDER=firestore` ou `realtime`
  - `AUTH_MODE=hybrid`
  - `MEDIA_STORAGE_PROVIDER=firebase`
  - `PAYMENT_PROVIDER=stripe`
  - `PAYMENT_FLOW_MODE=rmq` ou `sync`

### Observações de bootstrap

- O comando `start:prod:migrate` mantém compatibilidade Docker-first e executa pipeline Prisma antes do bootstrap do Nest.
- Em modo Firebase (`firestore`/`realtime`), o Prisma não é usado como repositório ativo em runtime, mas o projeto continua compatível com o fluxo operacional padrão.

### Deploy Railway

- Arquivo de suporte: `backend/railway.toml`.
- Runbook completo: [../docs/deploy/railway.md](../docs/deploy/railway.md)

</details>

## 🇺🇸 English Description
<details>
<summary><strong>View Details</strong></summary>

### Overview

NestJS backend with layered architecture (DDD + SOLID + Clean Code), Prisma persistence, and asynchronous payment flow using outbox + RabbitMQ + worker.

### Core responsibilities

- Authentication and authorization with JWT/JWE.
- Secure session with HttpOnly cookies (access/refresh) + CSRF protection.
- RBAC for `ADMIN` and `USER`.
- Movie CRUD (admin) and purchased movies delivery.
- Full credits system (balance, ledger, plan checkout, and mixed referrals).
- User profile management (profile updates, strong-password change, avatar upload).
- Admin credit management (plan CRUD + global bonus/referral config).
- Strict upload validation (type/size).
- Async payment with `mock` mode and real Stripe support through signed webhook.
- Provider matrix through configuration (Postgres/Firestore/Realtime, local/Firebase/hybrid auth, local/Firebase storage, Stripe sync/RMQ).
- Centralized logging with `nestjs-pino` and `ApiLogger`.

### Layered structure

- `src/domain`: entities and repository contracts.
- `src/application`: business rules and use cases.
- `src/infrastructure`: Prisma, gateways, messaging, auth providers.
- `src/presentation`: HTTP controllers and RMQ workers.
- `src/shared`: reusable cross-cutting components.

### Implemented enterprise security

- Helmet with environment-driven CSP (`CSP_ENABLED`, `CSP_REPORT_ONLY`, `CSP_CONNECT_SRC`).
- Credentialed CORS for cookie-based authentication.
- DTO validation with `class-validator`/`class-transformer`.
- JWT guard reading token from cookie with controlled header fallback.
- Double-submit CSRF (`cine_csrf_token` + `x-csrf-token` header).
- Global rate limiting.

### Implemented professional payment flow

- Checkout writes purchase + outbox event in one transaction.
- Outbox dispatcher publishes pending events with timeout and retries.
- Worker processes queue asynchronously with progressive retry.
- DLQ strategy for terminal failures (`RABBITMQ_PAYMENT_DLQ`).
- Signed Stripe webhook endpoint (`/payments/webhook/stripe`) for official confirmation.
- Parallel credits async path: `credit_purchase_outbox` + `CreditOutboxDispatcher` + `CreditPaymentWorker` (`credit.checkout.requested` event).
- Durable Stripe webhook idempotency with persisted processed-event tracking.

### Provider matrix (no hardcode)

- Database: `DATABASE_PROVIDER=postgres|firestore|realtime`
- Auth: `AUTH_MODE=local|firebase|hybrid`
- Media (avatar/poster): `MEDIA_STORAGE_PROVIDER=local|firebase`
- Payment provider: `PAYMENT_PROVIDER=mock|stripe`
- Stripe transport mode: `PAYMENT_FLOW_MODE=rmq|sync`

### Run locally (without Docker)

1. `npm install`
2. `npm run prisma:generate`
3. `npm run prisma:migrate:deploy`
4. `npm run start:dev`

### Run with Docker (recommended)

From project root:

- `docker-compose up --build`

Backend production-local bootstrap:

- `npm run start:prod:migrate`

### Main env variables (`/.env`)

- Runtime: `APP_ENV`, `PORT`, `APP_LOGGER_ENABLED`.
- CORS/CSP: `CORS_ALLOWED_ORIGINS`, `NEXT_PUBLIC_FRONTEND_URL`, `CSP_*`.
- Upload: `UPLOADS_DIR`, `UPLOAD_MAX_FILE_SIZE_MB`, `UPLOAD_ALLOWED_MIME_TYPES`.
- Auth: `JWT_*`, `AUTH_JWE_*`, `AUTH_COOKIE_*`, `CSRF_ENABLED`, `AUTH_MODE`, `AUTH_PROVIDER` (legacy alias), `FIREBASE_*`.
- Messaging: `RABBITMQ_URL`, `RABBITMQ_PAYMENT_QUEUE`, `RABBITMQ_PAYMENT_DLQ`, `RABBITMQ_PREFETCH`.
- Payment: `PAYMENT_PROVIDER`, `PAYMENT_FLOW_MODE`, `PAYMENT_MAX_RETRIES`, `PAYMENT_OUTBOX_*`, `STRIPE_*`.
- Firebase DB/CDN: `DATABASE_PROVIDER`, `MEDIA_STORAGE_PROVIDER`, `FIREBASE_DATABASE_URL`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_STORAGE_PUBLIC`, `FIREBASE_AUTH_EMULATOR_HOST`.
- Credits: `CREDIT_PAYMENT_MAX_RETRIES`, `CREDIT_OUTBOX_*`.
- Ready-to-copy bootstrap reference: `/envexample.txt`.
- For local execution, copy/rename `envexample.txt` to `.env` at project root.

### Recommended run profiles

- Simulated (fast/local):
  - `DATABASE_PROVIDER=postgres`
  - `AUTH_MODE=local`
  - `MEDIA_STORAGE_PROVIDER=local`
  - `PAYMENT_PROVIDER=mock`
  - `PAYMENT_FLOW_MODE=rmq`
- Hybrid Firebase + Stripe:
  - `DATABASE_PROVIDER=firestore` or `realtime`
  - `AUTH_MODE=hybrid`
  - `MEDIA_STORAGE_PROVIDER=firebase`
  - `PAYMENT_PROVIDER=stripe`
  - `PAYMENT_FLOW_MODE=rmq` or `sync`

### Bootstrap notes

- `start:prod:migrate` preserves Docker-first compatibility and runs Prisma pipeline before Nest startup.
- In Firebase database mode (`firestore`/`realtime`), Prisma is not the active runtime repository, while operational bootstrap remains consistent.

### Railway deployment

- Support file: `backend/railway.toml`.
- Full runbook: [../docs/deploy/railway.md](../docs/deploy/railway.md)

</details>
