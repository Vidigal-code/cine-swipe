# Cine-Swipe Movie Catalog

## 🇺🇸 English Description
<details>
<summary><strong>View Details</strong></summary>

### Introduction
Cine-Swipe is a movie catalog project utilizing Firebase and Stripe (or mocked environments). The architecture is designed to support end-to-end fullstack flows from registration, displaying media, payment simulation, and successful delivery.

### Technical Stack
- **Frontend**: Next.js 14, TailwindCSS, Redux Toolkit, React Query (Feature-Sliced Design)
- **Backend**: NestJS, Node.js, PostgreSQL via TypeORM (Domain-Driven Design)
- **Infra/DevOps**: Docker, Docker Compose, RabbitMQ

### How to Run
1. Ensure Docker and Docker Compose are installed.
2. Clone this repository and ensure the `.env` file exists at the root.
3. Run `docker-compose up --build`.
4. Access the frontend app natively.

</details>

## 🇧🇷 Descrição em Português
<details>
<summary><strong>Ver Detalhes</strong></summary>

### Introdução
O Cine-Swipe é um projeto de catálogo de filmes que simula fluxos reais de ponta a ponta (cadastro → mídia → cobrança → entrega) utilizando Firebase e Stripe (ou emuladores mockados).

### Tecnologias
- **Frontend**: Next.js 14, TailwindCSS, Redux Toolkit, React Query (Feature-Sliced Design)
- **Backend**: NestJS, Node.js, PostgreSQL via TypeORM (Domain-Driven Design)
- **Infra/DevOps**: Docker, Docker Compose, RabbitMQ

### Como Rodar Localmente
1. Certifique-se de que o Docker e o Docker Compose estão instalados.
2. Clone o repositório e verifique se as variáveis na raiz em `.env` estão corretas.
3. Execute `docker-compose up --build`.
4. O backend e o frontend estarão acessíveis nas portas configuradas.

</details>
