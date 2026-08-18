# Primeros pasos

Esta guía lleva CineSwipe desde cero hasta ejecutarse localmente.

## Requisitos previos

- Docker y Docker Compose (camino recomendado), o
- Node.js 20+, PostgreSQL 16 y RabbitMQ para ejecutar sin Docker

## Ejecución con Docker (recomendado)

1. Copia la plantilla de entorno:

```bash
cp envexample.txt .env
```

2. Levanta todo:

```bash
docker-compose up --build
```

3. Accede a:

- Frontend: `http://localhost:3000`
- Backend (API): `http://localhost:3001`
- Panel de RabbitMQ: `http://localhost:15672` (usuario/contraseña: `guest`/`guest`)

El `docker-compose.yml` levanta 4 servicios: `database` (postgres:16-alpine), `rabbitmq` (3-management-alpine), `backend` y `frontend`. El backend inicia con `npm run start:prod:migrate`, que ejecuta `prisma generate`, `prisma migrate deploy`, el seed y luego el servidor.

## Ejecución sin Docker

Backend:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
npm run start:dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Asegúrate de que `DATABASE_URL` apunte a un PostgreSQL accesible y de que `RABBITMQ_URL` apunte a un RabbitMQ activo (o usa `PAYMENT_FLOW_MODE=sync` para prescindir de RabbitMQ).

## Qué crea el seed

El `backend/prisma/seed.ts` puebla:

- Configuración del sistema de créditos (bono de registro 250, referidos habilitados, bono del referido 50, bono del referidor 100)
- Planes de créditos: Bronce (300 créditos / R$ 19,90), Plata (800 / R$ 44,90), Oro (1800 / R$ 89,90)
- Usuario administrador a partir de `ADMIN_USERNAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` (obligatorios)
- 4 películas de demostración con pósteres y tráileres de YouTube

## Primer acceso

1. Inicia sesión con el usuario admin definido en el `.env` o registra un usuario común en `/register`.
2. En el registro, la contraseña debe tener de 8 a 64 caracteres con mayúscula, minúscula, número y símbolo.
3. Opcionalmente introduce un código de referido (`ref_...`) para recibir el bono de referido.

## Pruebas

El backend cuenta con una suite e2e:

```bash
cd backend
npm run test:e2e
```

Cubre autenticación (cookies, CSRF, logout), películas con RBAC y upload, pagos asíncronos de extremo a extremo, auditoría, CRUD de usuarios admin y el webhook de Stripe (firma e idempotencia).

> Versión: 1.0.0
