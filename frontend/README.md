# Frontend - Cine-Swipe

## 🇧🇷 Descrição em Português
<details>
<summary><strong>Ver Detalhes</strong></summary>

### Visão geral

Frontend Next.js 14 em arquitetura FSD, tema dark/light com base orange, integração com backend via `NEXT_PUBLIC_API_URL`, e autenticação orientada a sessão segura por cookies.

### Responsabilidades

- Login/cadastro de usuário.
- Experiência separada para Admin e User.
- Catálogo público e detalhe do filme.
- Checkout e página "Meus Filmes".
- Painel admin para CRUD de filmes.
- Página `/credits` com saldo, histórico e compra de planos de créditos.
- Página `/profile` com atualização de dados, senha forte e upload de avatar.
- Página `/admin/credits` para CRUD de planos + configuração global de bônus/indicação.
- Popup responsivo reutilizável com variantes (`info`, `success`, `warning`, `error`) para feedback crítico (ex.: saldo insuficiente).

### Estrutura FSD

- `src/app`: rotas e composição de providers.
- `src/widgets`: blocos compostos de UI.
- `src/features`: comportamentos por feature.
- `src/entities`: modelos/UI de domínio.
- `src/shared`: store, api client, componentes base.
- Novas slices: `features/credits`, `features/profile`, `features/admin-credits`, `entities/credit`.
- Hooks e componentes de página extraídos para FSD (`features/*/model` e `features/*/ui`) para evitar páginas monolíticas.

### Autenticação enterprise no frontend

- Não usa mais `localStorage` para tokens.
- Sessão baseada em cookies HttpOnly emitidos pelo backend.
- Bootstrap via `/auth/me` com fallback em `/auth/refresh`.
- Logout server-side em `/auth/logout`.
- `apiClient` com `withCredentials: true` + header `x-csrf-token` em métodos mutáveis.

### Variáveis de ambiente

- `NEXT_PUBLIC_API_URL` (ex.: `http://localhost:3001`).
- `NEXT_PUBLIC_START_THEME` (padrão `dark`).
- `START_THEME` (fallback).

### Rodar local (sem Docker)

1. `npm install`
2. `npm run dev`
3. Abrir `http://localhost:3000`

### Rodar com Docker (recomendado)

Na raiz do projeto:

- `docker-compose up --build`

Configuração padrão:

- `NEXT_PUBLIC_API_URL=http://localhost:3001`
- `NEXT_PUBLIC_START_THEME=dark`

### Deploy Railway

- Arquivo de suporte: `frontend/railway.toml`.
- Runbook completo: [../docs/deploy/railway.md](../docs/deploy/railway.md)

</details>

## 🇺🇸 English Description
<details>
<summary><strong>View Details</strong></summary>

### Overview

Next.js 14 frontend using FSD architecture, dark/light theme with orange palette, backend integration through `NEXT_PUBLIC_API_URL`, and secure cookie-based session handling.

### Responsibilities

- User login/register flow.
- Separate Admin and User UX.
- Public movie catalog and movie detail page.
- Checkout flow and "My Movies" page.
- Admin dashboard for movie CRUD.
- `/credits` page with balance/history and BRL credit-plan checkout.
- `/profile` page for profile info, strong-password update, and avatar upload.
- `/admin/credits` page for plan CRUD and global bonus/referral settings.
- Reusable responsive popup with variants (`info`, `success`, `warning`, `error`) for critical feedback (e.g. insufficient credits).

### FSD structure

- `src/app`: routes and provider composition.
- `src/widgets`: composed UI blocks.
- `src/features`: feature behavior and UI.
- `src/entities`: domain-level models/UI.
- `src/shared`: store, api client, base components.
- New slices: `features/credits`, `features/profile`, `features/admin-credits`, `entities/credit`.
- Page logic and UI extracted into FSD hooks/components (`features/*/model` and `features/*/ui`) to avoid monolithic route files.

### Enterprise auth in frontend

- No token persistence in `localStorage`.
- Session based on HttpOnly cookies issued by backend.
- Bootstrap through `/auth/me` with `/auth/refresh` fallback.
- Server-side logout through `/auth/logout`.
- `apiClient` configured with `withCredentials: true` and `x-csrf-token` header for mutating requests.

### Environment variables

- `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:3001`).
- `NEXT_PUBLIC_START_THEME` (default `dark`).
- `START_THEME` (fallback).

### Run locally (without Docker)

1. `npm install`
2. `npm run dev`
3. Open `http://localhost:3000`

### Run with Docker (recommended)

From project root:

- `docker-compose up --build`

Default setup:

- `NEXT_PUBLIC_API_URL=http://localhost:3001`
- `NEXT_PUBLIC_START_THEME=dark`

### Railway deployment

- Support file: `frontend/railway.toml`.
- Full runbook: [../docs/deploy/railway.md](../docs/deploy/railway.md)

</details>
