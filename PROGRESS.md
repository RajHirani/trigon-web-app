# TRIGON Web: build progress

Standalone React app (no monorepo). Designs: Figma file, page "New Design" (section ids in `../FIGMA-STRUCTURE.md`). The mobile app is `../trigon-mobile-app`; code is ported by copying.

Last updated: 2026-11-13 (Playback)

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
- Live Track button goes to `/live/:vehicleId` (module 5); View More goes to the details page; Play Back goes to `/playback/:vehicleId` (module 6). The error state and the dropdown's hover/focus styling are not designed. Alert chips use FontAwesome stand-ins for the Figma icons (signal, battery). Loading shows no pager (page count is unknown until data arrives; Figma shows "Page 1 of 16"). The View More page (Figma 50:54073 and the lock dialog) is still to build. Mobile code reference: `features/dashboard`, `features/vehicleDetails`.

### 3b. Dashboard: View More / Vehicle details (done, mock)
- Figma 50:54073 (light), 50:59334 (dark), 50:56157 (loading), 50:55115 (lock dialog). Route `/dashboard/:vehicleId`; the card's View More button goes there. Header shows "Vehicle details" and "Dashboard › PLATE".
- Code: `src/features/vehicleDetails/` (`VehicleDetailsPage`, `SummaryTiles` incl. skeleton + address card, `LockDialog`, `useVehicleDetails`). Service: `getVehicle`, `getVehicleSummary`, `setDeviceLocked` in `vehicleService.ts` (mock in `mockVehicleBackend.ts`; `apiBackend` stubs). New tokens: `violet*`, `teal*`, `switch-off`, `scrim`.
- Behaviour: switching the lock on asks to confirm; switching it off unlocks directly (no Figma frame for that). The dialog's "Also deactivate everyone under …" checkbox exists in the Figma node but is not shown in the frame, so it is not built. "View on map" opens Google Maps (search link with the vehicle's lat,lng) in a new tab. Live Track opens `/live/:vehicleId`. Play Back opens `/playback/:vehicleId`.
- Open: not-found and error states are not designed (generic copy); dark mode and the mobile Figma frames (50:61432, 50:57259) were not compared pixel by pixel; phone width checked once.

### 5. Live Track (done, mock)
- Figma section 09: frames 16:11755 (main), 17:11985 (Share dialog), 17:12346 (panel collapsed). Route `/live/:vehicleId` (opened from the card's Live Track button and from View More). Code: `src/features/liveTrack/` (`LiveTrackPage`, `LiveMap` (react-leaflet), `LivePanel` (expanded + collapsed), `LiveOverlays` (header card, map buttons, path legend), `ShareDialog`, `useLiveTrack`, `geo.ts` + test). Service `services/liveTrack/liveTrackService.ts`, mock `mocks/mockLiveTrackBackend.ts` (the vehicle drives a looping route; `apiBackend` is a stub).
- Shell: for `/live/*` the app header and page padding are hidden; the sidebar is the same as on every page (expanded or collapsed per the user's saved choice); Dashboard stays highlighted (`alsoActiveFor` in `config/menu.ts`) because Live Track is opened from it. Live Track is a separate screen from Fleet Tracking (module 4, still todo); the Figma Live Track frame lights the route icon in the rail, which we did not copy. Measured at 1920x900: header 640x68, panel 396 wide at (96,108) (661 tall now that the position card is gone), map buttons at x 1856, legend 248x44, collapsed card 348 wide.
- By request the panel has no position / heading card (Figma has one). Drive To and the three buttons sit in a fixed footer so they stay visible while the rest scrolls on short screens; the three buttons wrap onto a second row when the panel is narrow instead of clipping.
- Behaviour: position and path refresh every 5 s (React Query), "updated N sec ago" counts up every second. Follow is on by default (map re-centres on each fix; dragging the map turns it off; the "Following vehicle" / "Follow vehicle" label shows only on hover or keyboard focus). Today's path can be hidden from the legend switch or the map button. Drive To opens Google Maps directions in a new tab. Share: link is created on open (default 6 hours), changing the duration makes a new link, Copy, Stop sharing (revokes and closes), Done.
- Marker: the mobile app's top-down vehicle SVGs (copied to `src/assets/vehicle-icons/`, mapped by `vehicleKindOf` in `features/liveTrack/vehicleIcons.ts`, same rules as mobile), tinted with the status colour and turned to the heading (scale 0.6; mobile uses 0.55). The dashboard card and header tiles still show the single truck glyph.
- Tiles: Leaflet with Google tiles loaded straight from Google's tile servers (`mt0-3.google.com/vt`), by request. The Layers button opens a picker: Map (default), Satellite, Hybrid. OpenStreetMap and Esri were removed. Risk: Google's terms only allow its tiles through the Google Maps Platform, so direct tile URLs can be blocked or rate-limited. TODO(prod): move to the Map Tiles API (same layer types, needs a billing API key). Dark mode inverts the Map layer with a CSS filter.
- Open: no Figma frames for loading, error, not-found, offline-vehicle, the "Custom" share duration (a plain hours field stands in), or dark mode / phone (phone is a stacked layout, collapsed panel by default; the sidebar drawer is not reachable on this screen, use Back). Device software "v2.4.1" is fixed text and battery / network / GPS health is derived from the vehicle's alerts until the API gives real values. The live feed is polled; the API step will likely use MQTT (package installed). Legend sits centred in the map, Figma has it at x 960.

### 6. Playback (done, mock; desktop light)
- Figma section 41 "Playback · Desktop · Light": frames 74:6 (playing), 75:345 (stop selected), 75:572 (custom range picker), 75:758 (range over 7 days), 75:944 (loading), 75:1130 (empty), 75:1500 (error), 75:1697 (panel collapsed). Route `/playback/:vehicleId`, opened from the dashboard card, View More and the Live Track panel (the three Play Back buttons). Code: `src/features/playback/` (`PlaybackPage`, `PlaybackMap`, `PlaybackPanel`, `PlaybackControls` (bottom bar + timeline), `PlaybackOverlays` (header, legend, empty/error card, loading), `RangePicker`, `MarkerCard`, `usePlayback` (queries + player clock), `analyze.ts` + `range.ts` (pure, tested)). Service `services/playback/playbackService.ts`, mock `mocks/mockPlaybackBackend.ts`; `apiBackend` is a stub.
- Shell: like Live Track the app header is hidden for `/playback/*`; Dashboard stays highlighted (`alsoActiveFor`). Reuses Live Track's `MapControls` (path and follow buttons are now optional props) and the Google tile config exported from `LiveMap.tsx`.
- Data contract for the API step: `getPlayback(vehicleId, from, to)` returns raw reports `{t, lat, lng, speed, km}` (km = distance since the first point). Stops, over-speed events and the summary are worked out on the client by `analyzeTrip` from the trip settings (over-speed limit 40-120 km/h, hold time 2-30 min), so changing a setting does not refetch. A pause of more than 15 min between reports counts as "no data" (not moving, not stopped). `getPlaceName(lat, lng)` (street name in the stop card) is a reverse-geocode.
- Behaviour: starts playing at 2x when a route arrives. The clock moves through the reports evenly (1x plays the whole route in 120 s), so gaps with no data are skipped. Timeline: drag, click or arrow keys / Home / End; ticks mark stops (dark) and over-speed spells (red). Follow is on by default and re-centres only when the vehicle leaves the middle of the map (dragging the map turns it off). Stop, over-speed and vehicle markers open a details card with the street name, the latitude / longitude (6 decimals) and a Google Maps link (new tab), plus "Play from here"; tapping the vehicle also pauses playback and the card shows that moment (time, speed, distance). The vehicle marker is Live Track's top-down icon. Opening a card pans the map so the card clears the panel, the header and the player bar (auto-pan padding in `PlaybackMap.tsx`; phones reserve the whole top part). Periods: Today, Yesterday, Last 7 days, Custom (calendar, dates only, by request: a custom period runs from 12:00 AM of the first day to 11:59 PM of the last day, or to now when the last day is today; at most 7 calendar days; over 7 days shows the red message with a "Request a Trip report" link to `/reports` and disables Apply). The panel's range card follows the picker live. By request (2026-11-13): no Travelled / Ahead / Over-speed / Stop legend bar (the Figma legend was dropped); the 1x/2x/4x/8x group is one button that cycles through the speeds; the picker sits above the player bar and, on screens shorter than 880px, opens at the top of the panel column and scrolls if needed so Apply / Cancel stay reachable. Play at the end restarts from the beginning.
- Mock: every day the vehicle drives the Live Track mock's route (stretched to 84.6 km) from 6:12 AM to 11:12 AM with 6 halts and 3 fast spells, so Today before 6:12 AM is "No movement found" (try Yesterday). Mock-only URL switches: `?playback=empty`, `?playback=error`.
- Checked: typecheck, lint, 21 new unit tests; in the browser (light + dark): load, playing, stop card, Play from here, custom picker, over 7 days, 7-day route (592 km, 42 stops), Yesterday, empty, error, collapsed, phone width (no horizontal scroll). Measured at 1920x900: header 640x68, legend at 760,36, panel 396 wide at (96,108), picker at (508,231) 380 wide, empty panel 288 tall, collapsed card 436 wide. Not compared pixel by pixel: dark mode. The browser pane was hidden while testing, so the animation was exercised through a timer-based requestAnimationFrame shim, not watched live.
- Loading: uses the shared animated `src/components/TrigonLoader.tsx`, ported from the mobile app's `TrigonLoader` (same route geometry, timings and car / truck / bike sprites; the sprite follows the vehicle type): the logo halves slide together, a vehicle drives a route on a small map, three step bars fill, "Taking longer than usual" after 15 s, Cancel goes back. One frame loop moves the SVG without re-rendering; reduced-motion shows the still end state. Loader colours are the `--loader-*` tokens in `index.css` (light + dark, from the mobile tokens). Reusable for other screens (e.g. Live Track, Reports).
- Open: the Figma mobile frames (section 42: Playing, Sheet expanded) are not built (phone is the stacked desktop layout, collapsed panel by default); no loading frame for the vehicle itself; the "Cancel" on the loader goes back; the stop-card address is mock text until the API gives reverse-geocoding; the vehicle disc shows a truck glyph for every vehicle type (as the dashboard card) while Live Track uses the top-down icons; Figma shows the timeline end labels as the period's start/end, ours show the first and last report.

### 4. Fleet Tracking (todo) / 7. Geofence (todo)
### 8. Users (todo) / 9. Devices (todo) / 10. Share Devices (todo)
### 11. Reports + Download Reports (todo) / 12. Notifications (todo)
### 13. Loader overlay + Splash/start-up (todo)

## Decisions log
- 2026-11-13: standalone app, no monorepo.
- 2026-11-13: Tailwind v4 driven by token CSS variables.
- 2026-11-13: Mock data first; API integration later behind the same service interfaces.
- 2026-11-13: Header follows Figma (Light/Dark pill, no search, no bell); "System" theme is not in the UI but is still the first-load default.
