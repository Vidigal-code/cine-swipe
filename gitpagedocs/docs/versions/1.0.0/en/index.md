# CineSwipe

CineSwipe is a fullstack movie catalog and store: a NestJS backend with PostgreSQL/Prisma, RabbitMQ, and Stripe, and a Next.js 14 (App Router) frontend with Tailwind CSS.

## What the project delivers

- Public movie catalog with pagination and a details page with YouTube trailer
- Movie purchases with an asynchronous payment flow (outbox + RabbitMQ) or synchronous
- Credit wallet with plans, transaction history (ledger), and a sign-up bonus
- Referral system with rewards for both the referred user and the referrer
- Admin panel: CRUD for movies, users, credit plans, and payment auditing
- Authentication with HttpOnly cookies (JWT + JWE) and CSRF protection

## Quick navigation

- Open **Getting Started** to run the project locally.
- Open **Project overview** to understand the stack and repository structure.
- Open **Frontend** to learn about the screens and API integration.
- Open **Backend and API** for architecture, modules, and endpoints.
- Open **Payments and credits** for the Stripe flow, webhooks, and the credit system.
- Open **Configuration** for all environment variables.
- Open **Deployment** for Docker, Railway, migrations, and seed.

## Links

- Repository: [github.com/Vidigal-code/cine-swipe](https://github.com/Vidigal-code/cine-swipe)

> Version: 1.0.0
