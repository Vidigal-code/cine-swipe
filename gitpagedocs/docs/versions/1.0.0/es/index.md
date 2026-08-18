# CineSwipe

CineSwipe es un catálogo y tienda de películas fullstack: un backend NestJS con PostgreSQL/Prisma, RabbitMQ y Stripe, y un frontend Next.js 14 (App Router) con Tailwind CSS.

## Qué ofrece el proyecto

- Catálogo público de películas con paginación y página de detalles con tráiler de YouTube
- Compra de películas con flujo de pago asíncrono (outbox + RabbitMQ) o síncrono
- Cartera de créditos con planes, extracto (ledger) y bono de registro
- Sistema de referidos (referral) con recompensas para el referido y el referidor
- Panel de administración: CRUD de películas, usuarios, planes de créditos y auditoría de pagos
- Autenticación con cookies HttpOnly (JWT + JWE) y protección CSRF

## Navegación rápida

- Abre **Primeros pasos** para ejecutar el proyecto localmente.
- Abre **Visión general del proyecto** para entender el stack y la estructura del repositorio.
- Abre **Frontend** para conocer las pantallas y la integración con la API.
- Abre **Backend y API** para arquitectura, módulos y endpoints.
- Abre **Pagos y créditos** para el flujo de Stripe, webhooks y el sistema de créditos.
- Abre **Configuración** para todas las variables de entorno.
- Abre **Despliegue** para Docker, Railway, migraciones y seed.

## Enlaces

- Repositorio: [github.com/Vidigal-code/cine-swipe](https://github.com/Vidigal-code/cine-swipe)

> Versión: 1.0.0
