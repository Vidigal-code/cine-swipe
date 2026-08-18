# Deploy

## Docker local

O `docker-compose.yml` na raiz orquestra 4 serviços:

| Serviço | Imagem/Build | Porta | Observações |
|---|---|---|---|
| `database` | postgres:16-alpine | 5432 | Volume `pgdata` |
| `rabbitmq` | rabbitmq:3-management-alpine | 5672 / 15672 | UI de gestão em `:15672` |
| `backend` | `backend/Dockerfile` | 3001 | Comando `npm run start:prod:migrate`; volume `backend_uploads` |
| `frontend` | `frontend/Dockerfile` | 3000 | `NEXT_PUBLIC_*` entram como build args |

```bash
cp envexample.txt .env
docker-compose up --build
```

## Dockerfiles

- **Backend** (`backend/Dockerfile`): `node:20-alpine`, `npm install`, copia `prisma/` e o código, `prisma generate`, `nest build`, expõe 3001. CMD padrão `npm run start:prod` (o compose sobrepõe para a variante com migração).
- **Frontend** (`frontend/Dockerfile`): `node:20-alpine`, recebe `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_START_THEME` como ARG/ENV, `next build`, expõe 3000. Como as variáveis `NEXT_PUBLIC_*` são embutidas no build, mudar a URL da API exige rebuild.

## Railway (produção)

Runbook completo em `docs/deploy/railway.md`; template de variáveis em `docs/deploy/.envexampledeploy.txt`. São **dois serviços**:

1. **cine-swipe-backend** — root `backend`, NIXPACKS, build `npm install && npm run build`, start `npm run start:prod:migrate`, restart ON_FAILURE (10 tentativas). Com `DATABASE_PROVIDER` = `firestore`/`realtime`, troque o start para `npm run start:prod` (sem migração Prisma).
2. **cine-swipe-frontend** — root `frontend`, build igual, start `npm run start -- -p ${PORT:-3000}`.

Provisione PostgreSQL e RabbitMQ (plugins do Railway ou externos) e preencha `DATABASE_URL` e `RABBITMQ_URL`. Alternativamente use `PAYMENT_FLOW_MODE=sync` para dispensar o RabbitMQ.

## Migrações e seed

- Migrações Prisma em `backend/prisma/migrations/` (`0001_init` até `0006_processed_webhook_events`), aplicadas com `prisma migrate deploy`.
- O seed (`prisma/seed.ts`) é idempotente e roda dentro de `start:prod:migrate`: configuração de créditos, planos, admin e filmes demo.
- Além do seed, `admin-seed.service.ts` re-upserta o admin a cada boot (somente com `DATABASE_PROVIDER=postgres`).

## Stripe em produção

1. Defina `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`.
2. Registre o endpoint de webhook no dashboard do Stripe:

```
https://<dominio-do-backend>/payments/webhook/stripe
```

3. Assine os eventos `payment_intent.succeeded` e `payment_intent.payment_failed`.

## Checklist pós-deploy

- `GET /health` responde `{"status":"ok"}`
- Login do admin funciona e cookies são gravados (com HTTPS, use `AUTH_COOKIE_SECURE=true`; para domínios distintos de frontend/backend, `AUTH_COOKIE_SAMESITE=none`)
- `CORS_ALLOWED_ORIGINS` inclui a URL pública do frontend
- Catálogo lista os filmes do seed
- Uma compra de teste completa o ciclo (PENDING → COMPLETED em modo `rmq`)
- Painel `/admin/audit` registra os eventos

## CI

O repositório não possui pipelines (sem `.github/workflows`). Lint e testes rodam manualmente: `npm run lint` (ambos os pacotes) e `npm run test:e2e` (backend).

> Versão: 1.0.0
