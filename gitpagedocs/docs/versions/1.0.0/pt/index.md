# CineSwipe

CineSwipe é um catálogo e loja de filmes fullstack: um backend NestJS com PostgreSQL/Prisma, RabbitMQ e Stripe, e um frontend Next.js 14 (App Router) com Tailwind CSS.

## O que o projeto entrega

- Catálogo público de filmes com paginação e página de detalhes com trailer do YouTube
- Compra de filmes com fluxo de pagamento assíncrono (outbox + RabbitMQ) ou síncrono
- Carteira de créditos com planos, extrato (ledger) e bônus de cadastro
- Sistema de indicação (referral) com recompensas para indicado e indicador
- Painel administrativo: CRUD de filmes, usuários, planos de créditos e auditoria de pagamentos
- Autenticação com cookies HttpOnly (JWT + JWE) e proteção CSRF

## Navegação rápida

- Abra **Primeiros passos** para rodar o projeto localmente.
- Abra **Visão geral do projeto** para entender a stack e a estrutura do repositório.
- Abra **Frontend** para conhecer as telas e a integração com a API.
- Abra **Backend e API** para arquitetura, módulos e endpoints.
- Abra **Pagamentos e créditos** para o fluxo Stripe, webhooks e o sistema de créditos.
- Abra **Configuração** para todas as variáveis de ambiente.
- Abra **Deploy** para Docker, Railway, migrações e seed.

## Links

- Repositório: [github.com/Vidigal-code/cine-swipe](https://github.com/Vidigal-code/cine-swipe)

> Versão: 1.0.0
