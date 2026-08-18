# Frontend

El frontend es una app Next.js 14 (App Router) en TypeScript con Tailwind CSS, organizada en Feature-Sliced Design (`app` / `widgets` / `features` / `entities` / `shared`), con alias de import `@/*` hacia `./src/*`.

## Rutas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Público | Catálogo "En Cartelera" paginado (12 por página) |
| `/movie/[id]` | Público | Detalles de la película, tráiler incrustado y botón de compra (redirige a `/login` si no hay sesión) |
| `/login` | Público | Formulario de inicio de sesión |
| `/register` | Público | Registro con campo opcional de código de referido y validación de contraseña fuerte |
| `/my-movies` | Autenticado | Películas compradas; con `?success=true` hace polling cada 3 s esperando la cola de pago |
| `/credits` | Autenticado | Saldo, planes, extracto, compras de créditos y simulación de consumo de 500 créditos |
| `/profile` | Autenticado | Nombre/e-mail, cambio de contraseña, avatar y código de referido propio |
| `/admin` | ADMIN | CRUD de películas + upload de póster |
| `/admin/audit` | ADMIN | Registro de auditoría de pagos |
| `/admin/credits` | ADMIN | CRUD de planes de créditos y configuración global |
| `/admin/users` | ADMIN | Gestión de usuarios (listar, crear, editar, rol, eliminar) |

La protección de las rutas admin en el frontend es solo client-side (redirección vía `useEffect`); la aplicación real de permisos ocurre en el backend (`RolesGuard`).

## Providers y estado

`app/providers/RootProvider.tsx` compone: `ThemeProvider` (dark mode por clase, clave de storage `cine-swipe-theme`) → Redux `Provider` → `QueryClientProvider` (staleTime 60 s, sin refetch al enfocar) → `AuthBootstrap`.

- **Redux Toolkit** guarda solamente la autenticación (`features/auth/model/authSlice.ts`: `isAuthenticated`, `user`, `isHydrated`).
- **React Query** es dueño de todos los datos del servidor (películas, créditos, auditorías, usuarios).
- **Ningún token en localStorage** — la sesión vive en cookies HttpOnly.

## Comunicación con la API

`shared/api/apiClient.ts` define una única instancia de axios:

- `baseURL` = `NEXT_PUBLIC_API_URL` (predeterminado `http://localhost:3001`), `timeout` 15 s, `withCredentials: true`
- Un interceptor de request lee la cookie `cine_csrf_token` (no HttpOnly) y envía el header `x-csrf-token` en `POST/PUT/PATCH/DELETE`

Cada feature tiene su módulo de API (`features/auth/api/auth.api.ts`, `features/movie/api/movie.api.ts`, `features/payment/api/payment.api.ts`, `features/credits/api/credits.api.ts`, `features/profile/api/profile.api.ts` y los módulos de admin).

## Bootstrap de autenticación

`features/auth/ui/AuthBootstrap.tsx`: al montarse, llama a `GET /auth/me`; si falla intenta `POST /auth/refresh`; si vuelve a fallar, despacha `logout()` y marca la store como hidratada.

## Componentes destacados

- **Reproductor de tráiler** (`entities/movie/ui/MovieTrailer.tsx` + `shared/lib/youtube.ts`): acepta enlaces `youtube.com`, `youtu.be`, `/embed/` y `/shorts/`, construye la URL de embed y muestra una tarjeta de fallback con retry y enlace externo tras 6 s sin cargar.
- **Popup responsivo** (`shared/ui/feedback/ResponsivePopup.tsx`): variantes `info | success | warning | error`; usado, por ejemplo, en el aviso de créditos insuficientes.
- Kit compartido: `Button`, `Input`, `Select`, `Checkbox`, `FileInput`, `PaginationControls`.

## Tema

Paleta naranja con variables CSS en `app/globals.css` (`:root` claro / `.dark`), mapeadas en `tailwind.config.ts`. El tema inicial proviene de `NEXT_PUBLIC_START_THEME` vía `shared/config/theme.ts`.

## Idioma

Toda la interfaz está en pt-BR, con textos en archivos de constantes (p. ej.: `features/credits/model/credits.constants.ts`, `entities/credit/model/credit-labels.pt-br.ts`). No hay biblioteca de i18n.

> Versión: 1.0.0
