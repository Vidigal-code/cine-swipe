# Backend e API

Catálogo de filmes com autenticação, perfil, administração, compra de filmes, carteira de créditos e indicações. Compra de filme cobra seu preço em dinheiro; não desconta a carteira. Créditos têm checkout e consumo próprios. Os modos mock e Stripe precisam ser distinguidos ao interpretar uma compra aprovada.

## Fluxo e casos de falha

1. Cadastro/login valida credenciais locais ou token Firebase e cria sessão. Cookies de acesso/refresh são HttpOnly; o cookie CSRF é legível pelo cliente e acompanha x-csrf-token conforme configuração. Refresh, logout, alteração de senha/perfil e avatar possuem endpoints próprios. A lista e o detalhe de filmes alimentam a navegação e o checkout.

2. POST /payments/checkout recebe movieId e gera correlationId. No modo rmq, o repositório cria Purchase PENDING e outbox; no adaptador Prisma, ambos são gravados em transação. Dispatcher publica checkout.requested; worker chama o gateway, atualiza COMPLETED/FAILED e registra auditoria. Timeout, tentativas e DLQ são configuráveis. No modo sync, o gateway é chamado dentro da requisição.

3. Webhook /payments/webhook/stripe valida assinatura usando o corpo bruto e STRIPE_WEBHOOK_SECRET. Eventos já processados são reconhecidos; payment_intent.succeeded/failed atualizam compras. purchaseKind direciona créditos. correlationId fornece chave de idempotência ao gateway; evento processado e ledger possuem controles adicionais. Inspecione cada adaptador antes de assumir a mesma atomicidade fora do Prisma.

4. Planos de créditos → /credits/checkout → outbox/worker próprios → aprovação → ledger e saldo. /credits/consume aplica débito e rejeita saldo insuficiente. Cadastro pode conceder bônus base e bônus por indicação. A primeira compra de créditos aprovada do indicado pode recompensar o indicador; configuração, correlações e logs de recompensa evitam repetir o benefício no fluxo previsto. Admins gerenciam usuários, planos/configuração e auditoria.

| Método e caminho | Declaração |
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

## Exemplo de requisição

```http
POST /payments/checkout HTTP/1.1
Cookie: <authenticated-session-cookies>
x-csrf-token: <csrf-token>
Content-Type: application/json

{"movieId":"<existing-movie-id>"}
```

## Arquivos relacionados

- [backend/src/application/payment/payment.service.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/application/payment/payment.service.ts)
- [backend/src/application/credit/credit.service.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/application/credit/credit.service.ts)
- [backend/src/presentation/workers/payment-outbox.dispatcher.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/workers/payment-outbox.dispatcher.ts)
- [backend/src/presentation/workers/payment.worker.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/workers/payment.worker.ts)
- [backend/src/shared/config/platform.config.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/shared/config/platform.config.ts)
- [backend/prisma/schema.prisma](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/prisma/schema.prisma)
- [docker-compose.yml](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/docker-compose.yml)

## Navegação

- [Project guide](?menu=pt&lang=pt&id=9)
- [Source reference](?menu=pt&lang=pt&id=10)
