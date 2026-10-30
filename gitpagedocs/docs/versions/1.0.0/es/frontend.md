# Frontend

Catálogo de películas con autenticación, perfil, administración, compras, cartera de créditos y referidos. Comprar una película cobra su precio monetario; no descuenta créditos. Estos tienen checkout y consumo propios. Distinga modos mock y Stripe al interpretar compras aprobadas.

## Interfaz y estado

Backend TypeScript/NestJS 11 con Prisma 6.7/PostgreSQL, RabbitMQ, Firebase Admin y Stripe. Domain contiene entidades/puertos; application servicios; infrastructure repositorios, autenticación, gateways y mensajería; presentation controllers/workers. Frontend Next.js 14.2.35, React 18, Redux Toolkit y TanStack Query 5. local/firebase/hybrid seleccionan autenticación; la configuración de plataforma selecciona persistencia y procesamiento.

Prisma relaciona User, Movie, Purchase, PaymentAudit, PaymentOutbox, CreditPlan, CreditSystemConfig, CreditTransaction, CreditPurchase, CreditPurchaseOutbox, ReferralRewardLog y ProcessedWebhookEvent. Secretos Stripe/Firebase quedan en backend. Configure cookies, CORS, CSRF y uploads para el dominio real. Una aprobación mock no confirma dinero; verifique saldo/historial en backend.

Registro/login valida credenciales locales o token Firebase y crea sesión. Cookies de acceso/refresh son HttpOnly; CSRF es legible por el cliente y acompaña x-csrf-token cuando está habilitado. Refresh, logout, contraseña/perfil y avatar tienen endpoints propios. Lista/detalle alimentan navegación y checkout.

## Fuentes verificadas

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
