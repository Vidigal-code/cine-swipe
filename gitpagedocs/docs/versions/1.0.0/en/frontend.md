# Frontend

Movie catalog with authentication, profiles, administration, movie purchases, a credit wallet and referrals. Movie checkout charges its monetary price; it does not debit the wallet. Credits have their own checkout and consumption. Distinguish mock and Stripe modes when interpreting approved purchases.

## UI and state

TypeScript/NestJS 11 backend with Prisma 6.7/PostgreSQL, RabbitMQ, Firebase Admin and Stripe. Domain contains entities/ports; application has services; infrastructure has repositories, authentication, gateways and messaging; presentation exposes controllers/workers. Frontend: Next.js 14.2.35, React 18, Redux Toolkit and TanStack Query 5. local/firebase/hybrid modes select authentication; platform configuration selects persistence and processing.

The Prisma schema relates User, Movie, Purchase, PaymentAudit, PaymentOutbox, CreditPlan, CreditSystemConfig, CreditTransaction, CreditPurchase, CreditPurchaseOutbox, ReferralRewardLog and ProcessedWebhookEvent. Stripe/Firebase secrets stay on the backend. Configure cookies, CORS, CSRF and uploads for the actual domain. Mock approval is not financial confirmation; verify balances/history on the backend, not only React state.

Registration/login validates local credentials or a Firebase token and creates a session. Access/refresh cookies are HttpOnly; the CSRF cookie is readable by the client and accompanies x-csrf-token when enabled. Refresh, logout, password/profile changes and avatars have dedicated endpoints. Movie list/detail feed browsing and checkout.

## Verified sources

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

## Related files

- [backend/src/application/payment/payment.service.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/application/payment/payment.service.ts)
- [backend/src/application/credit/credit.service.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/application/credit/credit.service.ts)
- [backend/src/presentation/workers/payment-outbox.dispatcher.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/workers/payment-outbox.dispatcher.ts)
- [backend/src/presentation/workers/payment.worker.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/presentation/workers/payment.worker.ts)
- [backend/src/shared/config/platform.config.ts](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/src/shared/config/platform.config.ts)
- [backend/prisma/schema.prisma](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/backend/prisma/schema.prisma)
- [docker-compose.yml](https://github.com/Vidigal-code/cine-swipe/blob/e169e2b03d50a8a73eaf0d9f8a1e96c4ff8ab614/docker-compose.yml)

## Navigation

- [Project guide](?menu=en&lang=en&id=9)
- [Source reference](?menu=en&lang=en&id=10)
