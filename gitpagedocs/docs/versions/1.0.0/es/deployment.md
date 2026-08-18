# Despliegue

## Docker local

El `docker-compose.yml` en la raíz orquesta 4 servicios:

| Servicio | Imagen/Build | Puerto | Observaciones |
|---|---|---|---|
| `database` | postgres:16-alpine | 5432 | Volumen `pgdata` |
| `rabbitmq` | rabbitmq:3-management-alpine | 5672 / 15672 | UI de gestión en `:15672` |
| `backend` | `backend/Dockerfile` | 3001 | Comando `npm run start:prod:migrate`; volumen `backend_uploads` |
| `frontend` | `frontend/Dockerfile` | 3000 | Las `NEXT_PUBLIC_*` entran como build args |

```bash
cp envexample.txt .env
docker-compose up --build
```

## Dockerfiles

- **Backend** (`backend/Dockerfile`): `node:20-alpine`, `npm install`, copia `prisma/` y el código, `prisma generate`, `nest build`, expone 3001. CMD predeterminado `npm run start:prod` (el compose lo sobrescribe con la variante con migración).
- **Frontend** (`frontend/Dockerfile`): `node:20-alpine`, recibe `NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_START_THEME` como ARG/ENV, `next build`, expone 3000. Como las variables `NEXT_PUBLIC_*` se embeben en el build, cambiar la URL de la API exige un rebuild.

## Railway (producción)

Runbook completo en `docs/deploy/railway.md`; plantilla de variables en `docs/deploy/.envexampledeploy.txt`. Son **dos servicios**:

1. **cine-swipe-backend** — root `backend`, NIXPACKS, build `npm install && npm run build`, start `npm run start:prod:migrate`, restart ON_FAILURE (10 intentos). Con `DATABASE_PROVIDER` = `firestore`/`realtime`, cambia el start a `npm run start:prod` (sin migración Prisma).
2. **cine-swipe-frontend** — root `frontend`, build igual, start `npm run start -- -p ${PORT:-3000}`.

Aprovisiona PostgreSQL y RabbitMQ (plugins de Railway o externos) y completa `DATABASE_URL` y `RABBITMQ_URL`. Alternativamente usa `PAYMENT_FLOW_MODE=sync` para prescindir de RabbitMQ.

## Migraciones y seed

- Migraciones Prisma en `backend/prisma/migrations/` (`0001_init` hasta `0006_processed_webhook_events`), aplicadas con `prisma migrate deploy`.
- El seed (`prisma/seed.ts`) es idempotente y se ejecuta dentro de `start:prod:migrate`: configuración de créditos, planes, admin y películas demo.
- Además del seed, `admin-seed.service.ts` re-upserta el admin en cada arranque (solo con `DATABASE_PROVIDER=postgres`).

## Stripe en producción

1. Define `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`.
2. Registra el endpoint de webhook en el dashboard de Stripe:

```
https://<dominio-do-backend>/payments/webhook/stripe
```

3. Suscríbete a los eventos `payment_intent.succeeded` y `payment_intent.payment_failed`.

## Checklist posdespliegue

- `GET /health` responde `{"status":"ok"}`
- El login del admin funciona y las cookies se guardan (con HTTPS, usa `AUTH_COOKIE_SECURE=true`; para dominios distintos de frontend/backend, `AUTH_COOKIE_SAMESITE=none`)
- `CORS_ALLOWED_ORIGINS` incluye la URL pública del frontend
- El catálogo lista las películas del seed
- Una compra de prueba completa el ciclo (PENDING → COMPLETED en modo `rmq`)
- El panel `/admin/audit` registra los eventos

## CI

El repositorio no posee pipelines (sin `.github/workflows`). Lint y pruebas se ejecutan manualmente: `npm run lint` (ambos paquetes) y `npm run test:e2e` (backend).

> Versión: 1.0.0
