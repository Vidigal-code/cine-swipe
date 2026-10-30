# Frontend

Catálogo de filmes com autenticação, perfil, administração, compra de filmes, carteira de créditos e indicações. Compra de filme cobra seu preço em dinheiro; não desconta a carteira. Créditos têm checkout e consumo próprios. Os modos mock e Stripe precisam ser distinguidos ao interpretar uma compra aprovada.

## Interface e estado

Backend TypeScript/NestJS 11 com Prisma 6.7/PostgreSQL, RabbitMQ, Firebase Admin e Stripe. Domain contém entidades/portas; application contém serviços; infrastructure contém repositórios, autenticação, gateways e mensageria; presentation expõe controllers/workers. Frontend Next.js 14.2.35, React 18, Redux Toolkit e TanStack Query 5. Modos local/firebase/hybrid selecionam autenticação; a configuração de plataforma seleciona persistência e processamento.

O esquema Prisma relaciona User, Movie, Purchase, PaymentAudit, PaymentOutbox, CreditPlan, CreditSystemConfig, CreditTransaction, CreditPurchase, CreditPurchaseOutbox, ReferralRewardLog e ProcessedWebhookEvent. Segredos Stripe/Firebase permanecem no backend. Configure cookies, CORS, CSRF e uploads segundo o domínio efetivo. Mock aprovado não é confirmação financeira; saldo e histórico devem ser verificados no backend, não apenas no estado React.

Cadastro/login valida credenciais locais ou token Firebase e cria sessão. Cookies de acesso/refresh são HttpOnly; o cookie CSRF é legível pelo cliente e acompanha x-csrf-token conforme configuração. Refresh, logout, alteração de senha/perfil e avatar possuem endpoints próprios. A lista e o detalhe de filmes alimentam a navegação e o checkout.

## Fontes verificadas

- [frontend/src/app/admin/audit/page.tsx](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/app/admin/audit/page.tsx)
- [frontend/src/app/admin/credits/page.tsx](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/app/admin/credits/page.tsx)
- [frontend/src/app/admin/page.tsx](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/app/admin/page.tsx)
- [frontend/src/app/admin/users/page.tsx](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/app/admin/users/page.tsx)
- [frontend/src/app/credits/page.tsx](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/app/credits/page.tsx)
- [frontend/src/app/login/page.tsx](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/app/login/page.tsx)
- [frontend/src/app/movie/[id]/page.tsx](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/app/movie/[id]/page.tsx)
- [frontend/src/app/my-movies/page.tsx](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/app/my-movies/page.tsx)
- [frontend/src/app/page.tsx](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/app/page.tsx)
- [frontend/src/app/profile/page.tsx](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/app/profile/page.tsx)
- [frontend/src/app/providers/RootProvider.tsx](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/app/providers/RootProvider.tsx)
- [frontend/src/app/register/page.tsx](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/app/register/page.tsx)
- [frontend/src/features/admin-audit/api/adminAudit.api.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/features/admin-audit/api/adminAudit.api.ts)
- [frontend/src/features/admin-credits/api/admin-credits.api.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/features/admin-credits/api/admin-credits.api.ts)
- [frontend/src/features/admin-users/api/admin-users.api.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/features/admin-users/api/admin-users.api.ts)
- [frontend/src/features/auth/api/auth.api.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/features/auth/api/auth.api.ts)
- [frontend/src/features/credits/api/credits.api.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/features/credits/api/credits.api.ts)
- [frontend/src/features/movie/api/movie.api.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/features/movie/api/movie.api.ts)
- [frontend/src/features/payment/api/payment.api.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/features/payment/api/payment.api.ts)
- [frontend/src/features/profile/api/profile.api.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/features/profile/api/profile.api.ts)
- [frontend/src/shared/api/apiClient.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/shared/api/apiClient.ts)
- [frontend/src/shared/store/store.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/frontend/src/shared/store/store.ts)

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
