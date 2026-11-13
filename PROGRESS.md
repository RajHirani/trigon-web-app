# TRIGON Web: build progress

Standalone React app (no monorepo). Designs: Figma file, page "New Design" (section ids in `../FIGMA-STRUCTURE.md`). The mobile app is `../trigon-mobile-app`; code is ported by copying.

Last updated: 2026-11-13

## Data mode: mock first, API later
All data runs on mock data while `VITE_USE_MOCK=true` (set in every `.env.*` file). Mock code lives in `src/mocks/`. To integrate the API: implement the `apiBackend` side of each service, set `VITE_USE_MOCK=false`, remove the mocks of finished modules. Each module keeps the same service interface for both, so screens do not change.

## Run
| Command | Env file | Use |
|---|---|---|
| `npm run dev` | `.env.localhost` | local dev (Vite proxies `/api` to `VITE_DEV_PROXY_TARGET`) |
| `npm run dev:server` | `.env.dev` | dev against the dev server config |
| `npm run build:dev` | `.env.dev` | dev build |
| `npm run build` / `build:prod` | `.env.prod` | production build |
| `npm run typecheck`, `npm test`, `npm run lint` | | checks |

Env values are validated at start-up in `src/config/env.ts`. The mode is called `localhost` because Vite reserves `.env.local`.

Mock login: `admin@trigon.test`, `dealer@trigon.test`, `retailer@trigon.test`, `user@trigon.test` with password `Trigon@123`. `deactivated@trigon.test` shows the deactivated message.

## Foundation (done)
- Vite + React 19 + TS, Tailwind v4, alias `@` = `src`.
- Design tokens as CSS variables in `src/index.css` (light + `data-theme="dark"`), exposed as Tailwind colours (`bg-surface`, `text-ink-2`, `border-line`, ...). Source: mobile `theme/tokens.ts`.
- Libraries: react-router-dom, React Query, zustand, axios, zod, react-hook-form, mqtt, FontAwesome, Leaflet (+ react-leaflet), Poppins.
- App shell `src/features/shell/AppShell.tsx`: sidebar (drawer below `lg`), top bar, theme toggle (persisted), logout. Menu in `src/config/menu.ts`. All routes besides Sign in are placeholders.
- Maps: Leaflet + CARTO tiles (Google Maps JS needs a billing card).

## Modules

### 1. Auth: Sign in (done)
- Figma sections 22 to 25. `src/features/auth/` (`SignInPage`, `AuthLayout`, `signInSchema`, `RequireAuth`).
- Responsive (brand panel from `lg`, banner below), light + dark, validation, error banner, show/hide password, redirect back to the page the user came from.
- Services: `src/services/auth/*`, `src/store/{sessionStore,roleStore}.ts`. Mock backend: `src/mocks/mockAuthBackend.ts` (+ test).
- Open for the API step: OAuth client id `trigon-web` registered? device_platform `web` accepted? Tokens are in localStorage (httpOnly refresh cookie would be safer, needs backend).

### 2. Auth: Forgot password, Check your email, Set new password (todo)
Route `/forgot-password` is a placeholder. Mobile has `ForgotPasswordScreen`, `CheckEmailScreen`.

### 3. Dashboard (todo)
Figma sections 05/06 (list, table, cards, loading, empty), View More page. Mobile code: `features/dashboard`, `features/vehicleDetails`.

### 4. Fleet Tracking (todo) / 5. Live Track (todo) / 6. Playback (todo) / 7. Geofence (todo)
### 8. Users (todo) / 9. Devices (todo) / 10. Share Devices (todo)
### 11. Reports + Download Reports (todo) / 12. Notifications (todo)
### 13. Loader overlay + Splash/start-up (todo)

## Decisions log
- 2026-11-13: standalone app, no monorepo.
- 2026-11-13: Tailwind v4 driven by token CSS variables.
- 2026-11-13: Mock data first; API integration later behind the same service interfaces.
