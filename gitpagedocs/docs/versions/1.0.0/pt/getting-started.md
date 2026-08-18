# Primeiros passos

Este guia leva o CineSwipe do zero até rodando localmente.

## Pré-requisitos

- Docker e Docker Compose (caminho recomendado), ou
- Node.js 20+, PostgreSQL 16 e RabbitMQ para rodar sem Docker

## Rodando com Docker (recomendado)

1. Copie o template de ambiente:

```bash
cp envexample.txt .env
```

2. Suba tudo:

```bash
docker-compose up --build
```

3. Acesse:

- Frontend: `http://localhost:3000`
- Backend (API): `http://localhost:3001`
- Painel do RabbitMQ: `http://localhost:15672` (usuário/senha: `guest`/`guest`)

O `docker-compose.yml` sobe 4 serviços: `database` (postgres:16-alpine), `rabbitmq` (3-management-alpine), `backend` e `frontend`. O backend inicia com `npm run start:prod:migrate`, que executa `prisma generate`, `prisma migrate deploy`, o seed e então o servidor.

## Rodando sem Docker

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

Garanta que `DATABASE_URL` aponte para um PostgreSQL acessível e que `RABBITMQ_URL` aponte para um RabbitMQ ativo (ou use `PAYMENT_FLOW_MODE=sync` para dispensar o RabbitMQ).

## O que o seed cria

O `backend/prisma/seed.ts` popula:

- Configuração do sistema de créditos (bônus de cadastro 250, indicação habilitada, bônus do indicado 50, bônus do indicador 100)
- Planos de créditos: Bronze (300 créditos / R$ 19,90), Prata (800 / R$ 44,90), Ouro (1800 / R$ 89,90)
- Usuário administrador a partir de `ADMIN_USERNAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` (obrigatórios)
- 4 filmes de demonstração com pôsteres e trailers do YouTube

## Primeiro acesso

1. Entre com o usuário admin definido no `.env` ou registre um usuário comum em `/register`.
2. No cadastro, a senha precisa ter 8 a 64 caracteres com maiúscula, minúscula, número e símbolo.
3. Opcionalmente informe um código de indicação (`ref_...`) para receber o bônus de indicado.

## Testes

O backend possui suíte e2e:

```bash
cd backend
npm run test:e2e
```

Cobre autenticação (cookies, CSRF, logout), filmes com RBAC e upload, pagamentos assíncronos ponta a ponta, auditoria, CRUD de usuários admin e o webhook do Stripe (assinatura e idempotência).

> Versão: 1.0.0
