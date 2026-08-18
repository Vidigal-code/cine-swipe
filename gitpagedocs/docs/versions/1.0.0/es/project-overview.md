# Visión general del proyecto

CineSwipe es un catálogo y tienda de películas fullstack. Los usuarios navegan por un catálogo público, ven tráileres, compran películas y gestionan una cartera de créditos; los administradores gestionan películas, usuarios, planes de créditos y la auditoría de pagos.

## Stack

| Capa | Tecnologías |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS 3.4, Redux Toolkit, TanStack React Query 5, axios, next-themes |
| Backend | NestJS 11, Prisma 6, PostgreSQL, RabbitMQ (`@nestjs/microservices`), Stripe 19, firebase-admin 13, JWT + JWE (jose), bcrypt, helmet, nestjs-pino |
| Infra | Docker Compose (postgres, rabbitmq, backend, frontend), Railway (despliegue) |

## Estructura del repositorio

| Ruta | Contenido |
|---|---|
| `backend/` | API NestJS: `src/`, `prisma/` (schema, migraciones, seed), `tests/e2e/`, `Dockerfile`, `railway.toml` |
| `frontend/` | UI Next.js: `src/` con arquitectura FSD, `Dockerfile`, `railway.toml` |
| `docker-compose.yml` | Orquestación local de los 4 servicios |
| `envexample.txt` | Plantilla de entorno para ejecución local |
| `docs/deploy/` | Runbook de Railway y plantilla de entorno de producción |

## Arquitectura del backend

El backend sigue capas inspiradas en Clean Architecture en `backend/src/`:

- `domain/` — entidades e interfaces de repositorio (`user`, `movie`, `payment`, `credit`)
- `application/` — servicios de casos de uso (`auth`, `admin-user`, `movie`, `payment`, `credit`, `media`)
- `infrastructure/` — repositorios Prisma y Firebase, guards de autenticación, gateways de pago, clientes RabbitMQ
- `presentation/` — controllers HTTP, DTOs y workers/dispatchers RMQ
- `shared/` — cookies, CSP, CORS, paginación, fábrica de respuestas, logger, seguridad de uploads, catálogos de mensajes en pt-BR
- `modules/` — wiring de los módulos Nest

## Arquitectura del frontend

El frontend usa Feature-Sliced Design (FSD) en `frontend/src/`: `app` (rutas y providers), `widgets`, `features`, `entities` y `shared`. Redux guarda únicamente el estado de autenticación; todos los datos del servidor viven en React Query.

## Proveedores intercambiables

Una característica central: cada dependencia externa tiene implementaciones alternativas seleccionadas por variable de entorno:

| Variable | Opciones | Efecto |
|---|---|---|
| `DATABASE_PROVIDER` | `postgres` (predeterminado), `firestore`, `realtime` | Repositorios Prisma o Firebase (estado JSON único en `cineswipe_state`) |
| `AUTH_MODE` | `local` (predeterminado), `firebase`, `hybrid` | Contraseña local, token Firebase, o ambos |
| `MEDIA_STORAGE_PROVIDER` | `local` (predeterminado), `firebase` | Uploads en disco (`/uploads/`) o Firebase Storage |
| `PAYMENT_FLOW_MODE` | `rmq` (predeterminado), `sync` | Checkout asíncrono vía outbox + cola, o inline |
| `PAYMENT_PROVIDER` | `mock` (predeterminado), `stripe` | Gateway simulado o Stripe real |

## Decisiones de diseño destacadas

- **Tráiler por URL**: las películas almacenan `trailerUrl` de YouTube; el reproductor convierte cualquier formato de enlace de YouTube en embed, con fallback tras 6 segundos.
- **Sesión por cookies HttpOnly**: access token JWT + refresh token JWE + cookie CSRF de double-submit; ningún token en localStorage.
- **Idempotencia en tres capas** en el flujo de pago: `idempotencyKey` en Stripe, tabla `processed_webhook_events` y constraint única `(userId, correlationId)` en el ledger de créditos.
- **Auditoría inmutable**: cada evento de pago genera una fila en `payment_audits` con snapshot desnormalizado.
- Todo el texto de la interfaz está en pt-BR, mantenido en archivos de constantes (sin biblioteca de i18n).

> Versión: 1.0.0
