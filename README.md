# Cine-Swipe

## 🇧🇷 Descrição em Português
<details>
<summary><strong>Ver Detalhes</strong></summary>

### Visão geral

O Cine-Swipe é um catálogo fullstack de filmes com separação Admin/User, arquitetura em camadas (DDD + SOLID + Clean Code), autenticação segura por cookies HttpOnly + CSRF, e pagamento assíncrono com RabbitMQ.

### Status do desafio técnico (nível enterprise)

- Admin: login e CRUD completo de filmes (título, sinopse, gênero, preço, pôster, trailer).
- Usuário comum: cadastro/login, catálogo público, página de detalhe, compra e "Meus Filmes".
- Pagamento: outbox transacional + worker assíncrono + retries + DLQ + webhook Stripe assinado.
- Créditos Enterprise: compra de créditos por plano (BRL), ledger completo, saldo/histórico, perfil (senha/avatar), e admin CRUD de planos/configuração global.
- Indicação mista: bônus para indicado no cadastro + bônus para indicador na primeira compra aprovada do indicado.
- Segurança: CSP por ambiente, Helmet, rate limit, RBAC, validação DTO, upload com limites e MIME types configuráveis.
- Observabilidade: logs centralizados com `nestjs-pino` + `ApiLogger` e correlação por `correlationId`.

### Stack técnica

- Frontend: Next.js 14, React 18, Tailwind, Redux Toolkit, React Query, FSD.
- Backend: NestJS 11, Prisma, PostgreSQL, RabbitMQ, JWT/JWE, Firebase Admin, Stripe.
- Infra local: Docker + Docker Compose (modo padrão).

### Execução 100% local (Docker-first)

1. Copie o arquivo de ambiente:
   - `cp .env.example .env` (Linux/macOS)
   - `copy .env.example .env` (Windows)
2. Suba o ambiente:
   - `docker-compose up --build`
3. Acesse:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:3001`
   - RabbitMQ UI: `http://localhost:15672` (`guest/guest`)

### Troubleshooting: Docker pull (`TLS timeout` / `EOF`)

Se ocorrer erro intermitente de pull no Docker Hub (por exemplo `TLS handshake timeout` ou `EOF`), use este fluxo:

1. Puxe as imagens base primeiro:
   - `docker compose pull database rabbitmq`
2. Suba o ambiente depois:
   - `docker compose up --build`
3. Se continuar instável no Windows + Docker Desktop:
   - Ajuste o Docker Engine (`%USERPROFILE%\\.docker\\daemon.json`) com DNS estável (ex.: `1.1.1.1`, `8.8.8.8`) e `max-concurrent-downloads`.
   - Reinicie o Docker Desktop (`docker desktop restart`).
   - Revise as configurações de proxy no Docker Desktop (System/Manual), principalmente em rede corporativa.

### Integrações simuladas e reais

- Padrão local/simulado:
  - `AUTH_PROVIDER=local`
  - `PAYMENT_PROVIDER=mock`
  - créditos e indicação habilitados via config global seed (`credit_system_config`, id=1)
- Variáveis novas de créditos/outbox:
  - `CREDIT_PAYMENT_MAX_RETRIES`, `CREDIT_OUTBOX_BATCH_SIZE`, `CREDIT_OUTBOX_MAX_ATTEMPTS`, `CREDIT_OUTBOX_DISPATCH_INTERVAL_MS`, `CREDIT_OUTBOX_RETRY_DELAY_MS`
- Suporte real:
  - Firebase: `AUTH_PROVIDER=firebase` + variáveis `FIREBASE_*`.
  - Stripe: `PAYMENT_PROVIDER=stripe` + `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`.

### Deploy (Railway)

- O projeto mantém foco local com Docker e também inclui suporte Railway.
- Guia completo: [docs/deploy/railway.md](docs/deploy/railway.md)

### Entregáveis não-código (checklist)

- [ ] Repositório GitHub privado com usuário convidado.
- [ ] Vídeo de 3 a 5 minutos mostrando fluxo E2E (cadastro/login, CRUD admin, compra, liberação em "Meus Filmes").
- [ ] Deploy funcional (Railway) com variáveis de ambiente configuradas.

### Documentação por módulo

- Backend: [backend/README.md](backend/README.md)
- Frontend: [frontend/README.md](frontend/README.md)

</details>

## 🇺🇸 English Description
<details>
<summary><strong>View Details</strong></summary>

### Overview

Cine-Swipe is a fullstack movie catalog with Admin/User separation, layered architecture (DDD + SOLID + Clean Code), secure auth with HttpOnly cookies + CSRF, and asynchronous payment processing through RabbitMQ.

### Technical challenge status (enterprise level)

- Admin: login and full movie CRUD (title, synopsis, genre, price, poster, trailer).
- Common User: register/login, public catalog, movie detail page, purchase flow, and "My Movies".
- Payments: transactional outbox + async worker + retries + DLQ + signed Stripe webhook.
- Enterprise credits: BRL credit-plan checkout, full ledger/history, profile management (password/avatar), and admin CRUD for plans/global credit rules.
- Mixed referrals: referee bonus on signup + referrer bonus after referee first approved credit purchase.
- Security: environment-driven CSP, Helmet, rate limiting, RBAC, DTO validation, and strict upload guardrails.
- Observability: centralized `nestjs-pino` + `ApiLogger` logs with `correlationId`.

### Technical stack

- Frontend: Next.js 14, React 18, Tailwind, Redux Toolkit, React Query, FSD.
- Backend: NestJS 11, Prisma, PostgreSQL, RabbitMQ, JWT/JWE, Firebase Admin, Stripe.
- Local infrastructure: Docker + Docker Compose (default mode).

### Run 100% locally (Docker-first)

1. Copy env file:
   - `cp .env.example .env` (Linux/macOS)
   - `copy .env.example .env` (Windows)
2. Start the stack:
   - `docker-compose up --build`
3. Access:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:3001`
   - RabbitMQ UI: `http://localhost:15672` (`guest/guest`)

### Troubleshooting: Docker pull (`TLS timeout` / `EOF`)

If you hit intermittent Docker Hub pull errors (for example `TLS handshake timeout` or `EOF`), use this recovery flow:

1. Pull base images first:
   - `docker compose pull database rabbitmq`
2. Start the stack afterwards:
   - `docker compose up --build`
3. If instability persists on Windows + Docker Desktop:
   - Tune Docker Engine (`%USERPROFILE%\\.docker\\daemon.json`) with stable DNS (for example `1.1.1.1`, `8.8.8.8`) and `max-concurrent-downloads`.
   - Restart Docker Desktop (`docker desktop restart`).
   - Review Docker Desktop proxy mode (System/Manual), especially in corporate networks.

### Simulated and real integrations

- Local simulated default:
  - `AUTH_PROVIDER=local`
  - `PAYMENT_PROVIDER=mock`
  - credit/referral engine bootstrapped by global seeded config (`credit_system_config`, id=1)
- New credit/outbox variables:
  - `CREDIT_PAYMENT_MAX_RETRIES`, `CREDIT_OUTBOX_BATCH_SIZE`, `CREDIT_OUTBOX_MAX_ATTEMPTS`, `CREDIT_OUTBOX_DISPATCH_INTERVAL_MS`, `CREDIT_OUTBOX_RETRY_DELAY_MS`
- Real integration support:
  - Firebase: `AUTH_PROVIDER=firebase` + `FIREBASE_*` variables.
  - Stripe: `PAYMENT_PROVIDER=stripe` + `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`.

### Deploy (Railway)

- The project remains Docker-first for local use and now includes Railway support.
- Full runbook: [docs/deploy/railway.md](docs/deploy/railway.md)

### Non-code deliverables checklist

- [ ] Private GitHub repository with invited user.
- [ ] 3-5 minute video showing the complete E2E flow.
- [ ] Working deployment (Railway) with environment variables configured.

### Module docs

- Backend: [backend/README.md](backend/README.md)
- Frontend: [frontend/README.md](frontend/README.md)

</details>
