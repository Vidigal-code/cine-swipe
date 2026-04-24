# Deploy Railway - Cine-Swipe

## 🇧🇷 Descrição em Português
<details>
<summary><strong>Ver Detalhes</strong></summary>

### Objetivo

Este guia adiciona suporte de deploy no Railway sem perder o modo principal do projeto: execução local 100% Docker-first.

### Estratégia de deploy

- Criar **2 serviços Railway** no mesmo projeto:
  - `cine-swipe-backend` (root: `backend`)
  - `cine-swipe-frontend` (root: `frontend`)
- Usar os arquivos:
  - `backend/railway.toml`
  - `frontend/railway.toml`

### Bootstrap local do `.env` (antes do deploy)

- Arquivo base versionado: `envexample.txt` (raiz do projeto).
- Copie/renomeie para `.env` antes de validar local:
  - `cp envexample.txt .env` (Linux/macOS)
  - `copy envexample.txt .env` (Windows)

### Serviço backend (Railway)

#### Variáveis obrigatórias

- `PORT` (Railway injeta automaticamente)
- `DATABASE_URL`
- `RABBITMQ_URL`
- `RABBITMQ_PAYMENT_QUEUE`
- `RABBITMQ_PAYMENT_DLQ`
- `JWT_SECRET`
- `AUTH_JWE_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `NEXT_PUBLIC_FRONTEND_URL`
- `PAYMENT_PROVIDER` (`mock` ou `stripe`)
- `AUTH_PROVIDER` (`local` ou `firebase`)

#### Variáveis para Stripe real

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CURRENCY=brl`

#### Variáveis para Firebase real

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON` (opcional, alternativa ao trio acima)

#### Comando de start

- `npm run start:prod:migrate`

Esse comando garante `prisma generate` + `prisma migrate deploy` antes do bootstrap do Nest.

### Serviço frontend (Railway)

#### Variáveis obrigatórias

- `PORT` (Railway injeta automaticamente)
- `NEXT_PUBLIC_API_URL` (URL pública do backend Railway)
- `NEXT_PUBLIC_START_THEME=dark`
- `START_THEME=dark`

### Webhook Stripe no Railway

1. Após deploy backend, copie a URL pública.
2. No dashboard Stripe, crie endpoint:
   - `https://<backend-domain>/payments/webhook/stripe`
3. Escute eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copie o segredo assinado para `STRIPE_WEBHOOK_SECRET`.

### Checklist de validação pós-deploy

- [ ] Backend sobe com migrações Prisma aplicadas.
- [ ] Frontend consome API pública correta (`NEXT_PUBLIC_API_URL`).
- [ ] Login/cadastro funcionam via cookie HttpOnly + CSRF.
- [ ] Checkout `mock` funciona com fila assíncrona.
- [ ] Checkout Stripe real confirma status via webhook.
- [ ] Logs exibem `correlationId` para rastreabilidade.
- [ ] Falhas finais de fila aparecem na DLQ.

</details>

## 🇺🇸 English Description
<details>
<summary><strong>View Details</strong></summary>

### Goal

This runbook adds Railway deployment support while preserving the default project mode: 100% local Docker-first execution.

### Deployment strategy

- Create **2 Railway services** in the same project:
  - `cine-swipe-backend` (root: `backend`)
  - `cine-swipe-frontend` (root: `frontend`)
- Use:
  - `backend/railway.toml`
  - `frontend/railway.toml`

### Local `.env` bootstrap (before deploy)

- Versioned base file: `envexample.txt` (project root).
- Copy/rename it to `.env` before local validation:
  - `cp envexample.txt .env` (Linux/macOS)
  - `copy envexample.txt .env` (Windows)

### Backend service (Railway)

#### Required variables

- `PORT` (injected by Railway)
- `DATABASE_URL`
- `RABBITMQ_URL`
- `RABBITMQ_PAYMENT_QUEUE`
- `RABBITMQ_PAYMENT_DLQ`
- `JWT_SECRET`
- `AUTH_JWE_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `NEXT_PUBLIC_FRONTEND_URL`
- `PAYMENT_PROVIDER` (`mock` or `stripe`)
- `AUTH_PROVIDER` (`local` or `firebase`)

#### Variables for real Stripe

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CURRENCY=brl`

#### Variables for real Firebase

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON` (optional, alternative to the trio above)

#### Start command

- `npm run start:prod:migrate`

This ensures `prisma generate` + `prisma migrate deploy` before Nest bootstrap.

### Frontend service (Railway)

#### Required variables

- `PORT` (injected by Railway)
- `NEXT_PUBLIC_API_URL` (public backend Railway URL)
- `NEXT_PUBLIC_START_THEME=dark`
- `START_THEME=dark`

### Stripe webhook on Railway

1. After backend deploy, copy public URL.
2. In Stripe dashboard, create endpoint:
   - `https://<backend-domain>/payments/webhook/stripe`
3. Listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy signed secret to `STRIPE_WEBHOOK_SECRET`.

### Post-deploy validation checklist

- [ ] Backend starts with Prisma migrations applied.
- [ ] Frontend points to correct API (`NEXT_PUBLIC_API_URL`).
- [ ] Login/register works with HttpOnly cookie + CSRF.
- [ ] `mock` checkout works through async queue.
- [ ] Real Stripe checkout syncs status through webhook.
- [ ] Logs include `correlationId` for traceability.
- [ ] Terminal queue failures are routed to DLQ.

</details>
