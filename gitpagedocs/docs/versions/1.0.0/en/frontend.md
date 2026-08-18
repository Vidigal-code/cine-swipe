# Frontend

The frontend is a Next.js 14 (App Router) app in TypeScript with Tailwind CSS, organized with Feature-Sliced Design (`app` / `widgets` / `features` / `entities` / `shared`), with the `@/*` import alias pointing to `./src/*`.

## Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Paginated "Now Showing" catalog (12 per page) |
| `/movie/[id]` | Public | Movie details, embedded trailer, and purchase button (redirects to `/login` when logged out) |
| `/login` | Public | Login form |
| `/register` | Public | Registration with an optional referral code field and strong password validation |
| `/my-movies` | Authenticated | Purchased movies; with `?success=true` it polls every 3s waiting for the payment queue |
| `/credits` | Authenticated | Balance, plans, transaction history, credit purchases, and a 500-credit consumption simulation |
| `/profile` | Authenticated | Name/e-mail, password change, avatar, and the user's own referral code |
| `/admin` | ADMIN | Movie CRUD + poster upload |
| `/admin/audit` | ADMIN | Payment audit trail |
| `/admin/credits` | ADMIN | Credit plan CRUD and global configuration |
| `/admin/users` | ADMIN | User management (list, create, edit, role, delete) |

Admin route protection on the frontend is client-side only (redirect via `useEffect`); actual permission enforcement happens on the backend (`RolesGuard`).

## Providers and state

`app/providers/RootProvider.tsx` composes: `ThemeProvider` (class-based dark mode, storage key `cine-swipe-theme`) → Redux `Provider` → `QueryClientProvider` (staleTime 60s, no refetch on focus) → `AuthBootstrap`.

- **Redux Toolkit** holds only authentication (`features/auth/model/authSlice.ts`: `isAuthenticated`, `user`, `isHydrated`).
- **React Query** owns all server data (movies, credits, audits, users).
- **No tokens in localStorage** — the session lives in HttpOnly cookies.

## API communication

`shared/api/apiClient.ts` defines a single axios instance:

- `baseURL` = `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`), `timeout` 15s, `withCredentials: true`
- A request interceptor reads the `cine_csrf_token` cookie (not HttpOnly) and sends the `x-csrf-token` header on `POST/PUT/PATCH/DELETE`

Each feature has its own API module (`features/auth/api/auth.api.ts`, `features/movie/api/movie.api.ts`, `features/payment/api/payment.api.ts`, `features/credits/api/credits.api.ts`, `features/profile/api/profile.api.ts`, and the admin modules).

## Authentication bootstrap

`features/auth/ui/AuthBootstrap.tsx`: on mount, it calls `GET /auth/me`; if that fails it tries `POST /auth/refresh`; if that fails again, it dispatches `logout()` and marks the store as hydrated.

## Notable components

- **Trailer player** (`entities/movie/ui/MovieTrailer.tsx` + `shared/lib/youtube.ts`): accepts `youtube.com`, `youtu.be`, `/embed/`, and `/shorts/` links, builds the embed URL, and shows a fallback card with retry and an external link after 6s without loading.
- **Responsive popup** (`shared/ui/feedback/ResponsivePopup.tsx`): `info | success | warning | error` variants; used, for example, in the insufficient-credits warning.
- Shared kit: `Button`, `Input`, `Select`, `Checkbox`, `FileInput`, `PaginationControls`.

## Theme

Orange palette with CSS variables in `app/globals.css` (light `:root` / `.dark`), mapped in `tailwind.config.ts`. The initial theme comes from `NEXT_PUBLIC_START_THEME` via `shared/config/theme.ts`.

## Language

The entire interface is in pt-BR, with texts in constants files (e.g., `features/credits/model/credits.constants.ts`, `entities/credit/model/credit-labels.pt-br.ts`). There is no i18n library.

> Version: 1.0.0
