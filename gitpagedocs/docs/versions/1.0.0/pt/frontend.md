# Frontend

O frontend é um app Next.js 14 (App Router) em TypeScript com Tailwind CSS, organizado em Feature-Sliced Design (`app` / `widgets` / `features` / `entities` / `shared`), com alias de import `@/*` para `./src/*`.

## Rotas

| Rota | Acesso | Descrição |
|---|---|---|
| `/` | Público | Catálogo "Em Cartaz" paginado (12 por página) |
| `/movie/[id]` | Público | Detalhes do filme, trailer embutido e botão de compra (redireciona para `/login` se deslogado) |
| `/login` | Público | Formulário de login |
| `/register` | Público | Cadastro com campo opcional de código de indicação e validação de senha forte |
| `/my-movies` | Autenticado | Filmes comprados; com `?success=true` faz polling a cada 3s aguardando a fila de pagamento |
| `/credits` | Autenticado | Saldo, planos, extrato, compras de créditos e simulação de consumo de 500 créditos |
| `/profile` | Autenticado | Nome/e-mail, troca de senha, avatar e código de indicação próprio |
| `/admin` | ADMIN | CRUD de filmes + upload de pôster |
| `/admin/audit` | ADMIN | Trilha de auditoria de pagamentos |
| `/admin/credits` | ADMIN | CRUD de planos de créditos e configuração global |
| `/admin/users` | ADMIN | Gestão de usuários (listar, criar, editar, papel, excluir) |

A proteção das rotas admin no frontend é apenas client-side (redirecionamento via `useEffect`); a aplicação real de permissões acontece no backend (`RolesGuard`).

## Providers e estado

`app/providers/RootProvider.tsx` compõe: `ThemeProvider` (dark mode por classe, chave de storage `cine-swipe-theme`) → Redux `Provider` → `QueryClientProvider` (staleTime 60s, sem refetch ao focar) → `AuthBootstrap`.

- **Redux Toolkit** guarda somente autenticação (`features/auth/model/authSlice.ts`: `isAuthenticated`, `user`, `isHydrated`).
- **React Query** é dono de todos os dados do servidor (filmes, créditos, auditorias, usuários).
- **Nenhum token em localStorage** — a sessão vive em cookies HttpOnly.

## Comunicação com a API

`shared/api/apiClient.ts` define uma única instância axios:

- `baseURL` = `NEXT_PUBLIC_API_URL` (padrão `http://localhost:3001`), `timeout` 15s, `withCredentials: true`
- Interceptor de request lê o cookie `cine_csrf_token` (não HttpOnly) e envia o header `x-csrf-token` em `POST/PUT/PATCH/DELETE`

Cada feature tem seu módulo de API (`features/auth/api/auth.api.ts`, `features/movie/api/movie.api.ts`, `features/payment/api/payment.api.ts`, `features/credits/api/credits.api.ts`, `features/profile/api/profile.api.ts` e os módulos de admin).

## Bootstrap de autenticação

`features/auth/ui/AuthBootstrap.tsx`: ao montar, chama `GET /auth/me`; se falhar tenta `POST /auth/refresh`; se falhar de novo, despacha `logout()` e marca a store como hidratada.

## Componentes notáveis

- **Player de trailer** (`entities/movie/ui/MovieTrailer.tsx` + `shared/lib/youtube.ts`): aceita links `youtube.com`, `youtu.be`, `/embed/` e `/shorts/`, monta a URL de embed e mostra um card de fallback com retry e link externo após 6s sem carregar.
- **Popup responsivo** (`shared/ui/feedback/ResponsivePopup.tsx`): variantes `info | success | warning | error`; usado, por exemplo, no aviso de créditos insuficientes.
- Kit compartilhado: `Button`, `Input`, `Select`, `Checkbox`, `FileInput`, `PaginationControls`.

## Tema

Paleta laranja com variáveis CSS em `app/globals.css` (`:root` claro / `.dark`), mapeadas no `tailwind.config.ts`. O tema inicial vem de `NEXT_PUBLIC_START_THEME` via `shared/config/theme.ts`.

## Idioma

Toda a interface é pt-BR, com textos em arquivos de constantes (ex.: `features/credits/model/credits.constants.ts`, `entities/credit/model/credit-labels.pt-br.ts`). Não há biblioteca de i18n.

> Versão: 1.0.0
