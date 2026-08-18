# Backend e API

API NestJS 11 com Prisma 6 sobre PostgreSQL, mensageria RabbitMQ e camadas inspiradas em Clean Architecture (`domain` → `application` → `infrastructure` / `presentation`).

## Bootstrap

`backend/src/main.ts` inicializa com `rawBody: true` (necessário para a assinatura do Stripe), logger pino, validação de configuração (`validatePlatformConfig()`), `cookie-parser`, helmet com CSP dirigida por ambiente, CORS com credenciais, `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`) e assets estáticos em `/uploads/`. Quando `PAYMENT_FLOW_MODE=rmq`, conecta também um microservice RabbitMQ (fila durável, DLX para a DLQ, `noAck: false`, prefetch configurável).

Guards globais: `ThrottlerGuard` (rate limit) e `RolesGuard` (RBAC por metadata `@Roles`).

## Endpoints

### Autenticação — `/auth`

| Método | Rota | Guard | Descrição |
|---|---|---|---|
| POST | `/auth/register` | — | Cadastro (com código de indicação opcional); define 3 cookies |
| POST | `/auth/login` | — | Login local ou com `firebaseIdToken` |
| POST | `/auth/refresh` | — | Renova sessão (checagem manual de CSRF) |
| GET | `/auth/me` | JWT | Usuário atual |
| POST | `/auth/logout` | JWT | Limpa cookies |
| PUT | `/auth/profile` | JWT | Atualiza nome/e-mail |
| PUT | `/auth/password` | JWT | Troca de senha (política forte + bcrypt) |
| POST | `/auth/avatar/upload` | JWT | Upload de avatar (multipart) |

### Filmes — `/movies`

| Método | Rota | Guard |
|---|---|---|
| GET | `/movies` | Público (paginado) |
| GET | `/movies/:id` | Público |
| POST | `/movies` | JWT + ADMIN |
| POST | `/movies/upload` | JWT + ADMIN (pôster) |
| PUT | `/movies/:id` | JWT + ADMIN |
| DELETE | `/movies/:id` | JWT + ADMIN |

### Pagamentos — `/payments`

| Método | Rota | Guard | Descrição |
|---|---|---|---|
| POST | `/payments/checkout` | JWT | Inicia compra de um filme (`{movieId}`) |
| GET | `/payments/my-movies` | JWT | Compras COMPLETED paginadas |
| GET | `/payments/admin/audits` | JWT + ADMIN | Trilha de auditoria |
| POST | `/payments/webhook/stripe` | Assinatura Stripe | Webhook (sem guard; valida `stripe-signature`) |

### Créditos — `/credits` e `/admin/credits`

| Método | Rota | Guard | Descrição |
|---|---|---|---|
| GET | `/credits/balance` | JWT | Saldo atual |
| GET | `/credits/plans` | JWT | Planos ativos |
| GET | `/credits/history` | JWT | Extrato (ledger) |
| GET | `/credits/purchases` | JWT | Compras de créditos |
| POST | `/credits/checkout` | JWT | Compra de plano (`{creditPlanId}`) |
| POST | `/credits/consume` | JWT | Consumo (`{amount, description, correlationId?}`) |
| GET/POST | `/admin/credits/plans` | JWT + ADMIN | Listar/criar planos |
| PATCH/DELETE | `/admin/credits/plans/:id` | JWT + ADMIN | Editar/remover plano |
| GET/PATCH | `/admin/credits/config` | JWT + ADMIN | Configuração global |

### Usuários (admin) — `/admin/users`

CRUD completo: `GET`, `POST`, `PATCH /:id`, `PATCH /:id/role`, `DELETE /:id`. Regras de segurança: não pode excluir a si mesmo, não pode mudar o próprio papel e não pode rebaixar/excluir o último ADMIN.

### Saúde

`GET /health` → `{status: "ok"}`.

## Autenticação e sessão

Três modos via `AUTH_MODE`: `local`, `firebase` e `hybrid` (a presença de `firebaseIdToken` escolhe o caminho Firebase). Sessão em 3 cookies:

- `cine_access_token` — JWT assinado (`JWT_SECRET`, expiração padrão 1d), HttpOnly
- `cine_refresh_token` — JWE (`jose`, A256GCM, chave = SHA-256 de `AUTH_JWE_SECRET`, padrão 7d), HttpOnly
- `cine_csrf_token` — token aleatório, legível pelo JS (padrão double-submit)

O `JwtAuthGuard` lê o cookie primeiro e cai para `Authorization: Bearer`; quando o token veio de cookie e o método é mutação, exige `x-csrf-token` igual ao cookie. Escalada de papel é bloqueada: pedir `ADMIN` no cadastro só funciona se o e-mail for igual a `ADMIN_EMAIL`.

Política de senha: 8–64 caracteres com minúscula, maiúscula, dígito e símbolo; hash bcrypt (custo 10).

## Modelo de dados (Prisma)

Principais modelos em `backend/prisma/schema.prisma`:

- **User** — credenciais, papel, `creditsBalance`, `referralCode` único, auto-relação de indicação, flags de bônus
- **Movie** — título, sinopse, gênero, `price Decimal(10,2)`, pôster e trailer
- **Purchase** — compra de filme com `status` (PENDING/COMPLETED/FAILED), `provider`, `correlationId` único e intent do Stripe
- **PaymentAudit** — trilha imutável com snapshot desnormalizado (nome, e-mail, título)
- **PaymentOutbox** / **CreditPurchaseOutbox** — padrão outbox com `attempts`, `nextAttemptAt` e status
- **CreditPlan**, **CreditPurchase**, **CreditTransaction** (ledger com `balanceBefore`/`balanceAfter` e unique `(userId, correlationId)`), **CreditSystemConfig** (singleton id=1), **ReferralRewardLog**
- **ProcessedWebhookEvent** — idempotência durável de webhooks

Cada repositório tem implementação Prisma e Firebase; a escolha é feita em tempo de injeção por `repository-provider.factory.ts` lendo `DATABASE_PROVIDER`.

## Segurança

- Helmet com CSP configurável, `frameAncestors 'none'`, HSTS 180 dias
- CORS com credenciais restrito a lista explícita de origens
- `ValidationPipe` global rejeita campos desconhecidos; `ParseUUIDPipe` em todas as rotas `:id`
- CSRF double-submit em mutações autenticadas por cookie
- Rate limit global (`RATE_LIMIT_*`)
- Upload endurecido: allowlist de MIME + checagem cruzada extensão↔MIME, limite de tamanho e nomes aleatórios
- Logs pino com correlação por `x-request-id`

> Versão: 1.0.0
