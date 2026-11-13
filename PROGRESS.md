# TRIGON Web: build progress

Standalone React app (no monorepo). Designs: Figma file, page "New Design" (section ids in `../FIGMA-STRUCTURE.md`). The mobile app is `../trigon-mobile-app`; code is ported by copying.

Last updated: 2026-11-13 (dashboard content)

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
- App shell `src/features/shell/`: `AppShell.tsx` (layout, drawer, page title and role-filtered menu), `Sidebar.tsx`, `Header.tsx`, `ThemeSwitcher.tsx`. Menu in `src/config/menu.ts`. All routes besides Sign in are placeholders.
  - Sidebar: 240px, 44px items, icon-only rail at 72px (collapse state saved in `trigon.sidebar.collapsed`), drawer below `lg` (closes on Esc, backdrop, navigation). Items are hidden when the user's role is not in the item's `roles`.
  - Header: matches Figma "Dashboard / Desktop / Light" and the dark frame: 72px, title + subtitle (the Dashboard subtitle is a live clock, "Live fleet status · date, time"), Light/Dark pill, user pill (avatar, name, role, chevron). No search box and no notification bell (removed by request; the Notifications sidebar item stays). On phones the toggle is icon-only and the role/chevron hide.
  - Theme: `src/store/themeStore.ts` keeps `preference` (`light` | `dark` | `system`) and `mode` (resolved). First load follows the OS; picking Light or Dark in the header saves the choice (`trigon.theme`). Toggle colours are the `toggle-*` tokens in `index.css`.
  - Favicon is the TRIGON mark (`public/favicon.svg`).
  - Open: the user pill's chevron has no dropdown yet (Logout is in the sidebar); the rest of the sidebar has not been compared to Figma beyond width and item height.
- Maps: Leaflet + CARTO tiles (Google Maps JS needs a billing card).

## Modules

### 1. Auth: Sign in (done)
- Figma sections 22 to 25. `src/features/auth/` (`SignInPage`, `AuthLayout`, `signInSchema`, `RequireAuth`).
- Responsive (brand panel from `lg`, banner below), light + dark, validation, error banner, show/hide password, redirect back to the page the user came from.
- Services: `src/services/auth/*`, `src/store/{sessionStore,roleStore}.ts`. Mock backend: `src/mocks/mockAuthBackend.ts` (+ test).
- Open for the API step: OAuth client id `trigon-web` registered? device_platform `web` accepted? Tokens are in localStorage (httpOnly refresh cookie would be safer, needs backend).

### 2. Auth: Forgot password, Check your email, Set new password (done, mock)
- Set new password: Figma "Set new password" frames. `ResetPasswordPage.tsx` on `/reset-password?token=...`, schema `resetPasswordSchema` (8+ chars, number, symbol, confirm must match). On success goes to `/login` with a "Password updated" notice. Mock: token `expired` (or no token) shows the expired-link state with a "Request a new link" link; any other token works. `resetPassword` in `passwordResetService.ts`, API side is a stub. Open: expired-link, failure and success copy are placeholders (not designed); the real reset-link URL format comes from the backend email.
- Figma "Forgot password" and "Check your email" frames (desktop/mobile, light/dark). `src/features/auth/ForgotPasswordPage.tsx` shows both steps on `/forgot-password` (form, then "Check your email" with Resend link). Schema: `forgotPasswordSchema`.
- Service: `src/services/auth/passwordResetService.ts`; mock `src/mocks/mockPasswordResetBackend.ts` (any email succeeds; `fail@trigon.test` shows the error banner). `apiBackend.requestReset` is a stub: endpoint to be confirmed.
- Open: request-failure and resend-failure copy not designed; "Set new password" has no Figma frame yet.

### 3. Dashboard (page content done, mock; View More page todo)
Shell: see Foundation. Page content: `src/features/dashboard/` (`DashboardPage`, `KpiRow`, `Toolbar`, `VehicleViews` = the card only, `VehicleParts`, `SpeedGauge`, `Pagination`, `DashboardStates` = empty + skeleton). Data: `services/vehicles/vehicleService.ts` (mock `src/mocks/mockVehicleBackend.ts`, 128 vehicles, 9 per page (the page size comes from the server in the API step); `apiBackend` is a stub until the endpoints exist), hooks in `useVehicles.ts`.
- Card view only (list and table views from Figma 38:2 / 38:933 were dropped by request). Matches Figma frames 10:19 (cards), 38:1864 (loading), 38:2795 / 38:3726 (empty), 12:1283 (device type); dark checked, phone width checked.
- Behaviour: KPI tile filters by plan; search runs on Enter or when emptied; device-type dropdown has its own search; any filter resets to page 1. Add `?fleet=empty` to the URL (mock mode) to see the "No vehicles yet" state.
- Loader: `VehiclesSkeleton` in `DashboardStates.tsx` follows Figma 38:1864 (Skeleton Card 396 x 420, bar sizes and tones). KPI tiles show a value skeleton and an empty track; the counter reads "Loading vehicles…"; a disabled pager is drawn from the fleet size once the KPIs arrive (page size assumed from `PAGE_SIZE_HINT` until the data does). Pulse is skipped for reduced-motion users.
- Responsive: the card grid auto-fills columns at a 360px minimum (`layout.ts`; 3 per row on a ~1500px screen; a forced 4-per-row layout was tried and rolled back by request). The card adapts to its own width with container queries (compact below 380px: no button icons, smaller gauge) so the three buttons never leave the card. KPI tiles are one swipeable row below `md`.
- New tokens in `index.css`: `gauge-track`, `selected`, `icon-tile`, `placeholder`, `control`, `skeleton*`, `ac`/`ac-bg`.
- Open: Live Track button goes to `/fleet` (placeholder), Play Back and View More do nothing until those screens exist. The error state and the dropdown's hover/focus styling are not designed. Alert chips use FontAwesome stand-ins for the Figma icons (signal, battery). Loading shows no pager (page count is unknown until data arrives; Figma shows "Page 1 of 16"). The View More page (Figma 50:54073 and the lock dialog) is still to build. Mobile code reference: `features/dashboard`, `features/vehicleDetails`.

### 3b. Dashboard: View More / Vehicle details (done, mock)
- Figma 50:54073 (light), 50:59334 (dark), 50:56157 (loading), 50:55115 (lock dialog). Route `/dashboard/:vehicleId`; the card's View More button goes there. Header shows "Vehicle details" and "Dashboard › PLATE".
- Code: `src/features/vehicleDetails/` (`VehicleDetailsPage`, `SummaryTiles` incl. skeleton + address card, `LockDialog`, `useVehicleDetails`). Service: `getVehicle`, `getVehicleSummary`, `setDeviceLocked` in `vehicleService.ts` (mock in `mockVehicleBackend.ts`; `apiBackend` stubs). New tokens: `violet*`, `teal*`, `switch-off`, `scrim`.
- Behaviour: switching the lock on asks to confirm; switching it off unlocks directly (no Figma frame for that). The dialog's "Also deactivate everyone under …" checkbox exists in the Figma node but is not shown in the frame, so it is not built. "View on map" opens Google Maps (search link with the vehicle's lat,lng) in a new tab. Play Back is disabled until that screen exists.
- Open: not-found and error states are not designed (generic copy); dark mode and the mobile Figma frames (50:61432, 50:57259) were not compared pixel by pixel; phone width checked once.

### 4. Fleet Tracking (todo) / 5. Live Track (todo) / 6. Playback (todo) / 7. Geofence (todo)
### 8. Users (todo) / 9. Devices (todo) / 10. Share Devices (todo)
### 11. Reports + Download Reports (todo) / 12. Notifications (todo)
### 13. Loader overlay + Splash/start-up (todo)

## Decisions log
- 2026-11-13: standalone app, no monorepo.
- 2026-11-13: Tailwind v4 driven by token CSS variables.
- 2026-11-13: Mock data first; API integration later behind the same service interfaces.
- 2026-11-13: Header follows Figma (Light/Dark pill, no search, no bell); "System" theme is not in the UI but is still the first-load default.
