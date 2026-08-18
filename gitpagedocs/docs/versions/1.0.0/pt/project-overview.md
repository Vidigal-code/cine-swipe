# Visão geral do projeto

CineSwipe é um catálogo e loja de filmes fullstack. Usuários navegam por um catálogo público, assistem trailers, compram filmes e gerenciam uma carteira de créditos; administradores gerenciam filmes, usuários, planos de créditos e auditoria de pagamentos.

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS 3.4, Redux Toolkit, TanStack React Query 5, axios, next-themes |
| Backend | NestJS 11, Prisma 6, PostgreSQL, RabbitMQ (`@nestjs/microservices`), Stripe 19, firebase-admin 13, JWT + JWE (jose), bcrypt, helmet, nestjs-pino |
| Infra | Docker Compose (postgres, rabbitmq, backend, frontend), Railway (deploy) |

## Estrutura do repositório

| Caminho | Conteúdo |
|---|---|
| `backend/` | API NestJS: `src/`, `prisma/` (schema, migrações, seed), `tests/e2e/`, `Dockerfile`, `railway.toml` |
| `frontend/` | UI Next.js: `src/` em arquitetura FSD, `Dockerfile`, `railway.toml` |
| `docker-compose.yml` | Orquestração local dos 4 serviços |
| `envexample.txt` | Template de ambiente para execução local |
| `docs/deploy/` | Runbook do Railway e template de ambiente de produção |

## Arquitetura do backend

O backend segue camadas inspiradas em Clean Architecture em `backend/src/`:

- `domain/` — entidades e interfaces de repositório (`user`, `movie`, `payment`, `credit`)
- `application/` — serviços de caso de uso (`auth`, `admin-user`, `movie`, `payment`, `credit`, `media`)
- `infrastructure/` — repositórios Prisma e Firebase, guards de autenticação, gateways de pagamento, clientes RabbitMQ
- `presentation/` — controllers HTTP, DTOs e workers/dispatchers RMQ
- `shared/` — cookies, CSP, CORS, paginação, fábrica de respostas, logger, segurança de upload, catálogos de mensagens em pt-BR
- `modules/` — wiring dos módulos Nest

## Arquitetura do frontend

O frontend usa Feature-Sliced Design (FSD) em `frontend/src/`: `app` (rotas e providers), `widgets`, `features`, `entities` e `shared`. Redux guarda apenas o estado de autenticação; todos os dados do servidor vivem no React Query.

## Provedores plugáveis

Uma característica central: cada dependência externa tem implementações alternativas selecionadas por variável de ambiente:

| Variável | Opções | Efeito |
|---|---|---|
| `DATABASE_PROVIDER` | `postgres` (padrão), `firestore`, `realtime` | Repositórios Prisma ou Firebase (estado JSON único em `cineswipe_state`) |
| `AUTH_MODE` | `local` (padrão), `firebase`, `hybrid` | Senha local, token Firebase, ou ambos |
| `MEDIA_STORAGE_PROVIDER` | `local` (padrão), `firebase` | Uploads em disco (`/uploads/`) ou Firebase Storage |
| `PAYMENT_FLOW_MODE` | `rmq` (padrão), `sync` | Checkout assíncrono via outbox + fila, ou inline |
| `PAYMENT_PROVIDER` | `mock` (padrão), `stripe` | Gateway simulado ou Stripe real |

## Decisões de design notáveis

- **Trailer por URL**: filmes armazenam `trailerUrl` do YouTube; o player converte qualquer formato de link do YouTube em embed, com fallback após 6 segundos.
- **Sessão por cookies HttpOnly**: access token JWT + refresh token JWE + cookie CSRF de double-submit; nada de token em localStorage.
- **Idempotência em três camadas** no fluxo de pagamento: `idempotencyKey` no Stripe, tabela `processed_webhook_events` e constraint única `(userId, correlationId)` no ledger de créditos.
- **Auditoria imutável**: cada evento de pagamento gera uma linha em `payment_audits` com snapshot desnormalizado.
- Todo o texto da interface é em pt-BR, mantido em arquivos de constantes (sem biblioteca de i18n).

> Versão: 1.0.0
