# CabBook — Uber-style Cab Booking App

Full-stack ride-hailing app built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Clerk** for authentication. The interface uses **Motion for React** for interaction and reveal animations, plus **next-themes** for persistent light/dark mode.

## Progress

- [x] **Day 1 — Project setup & authentication**
  - [x] Initialize Next.js project (TypeScript, App Router, `src/` dir, ESLint)
  - [x] Install and configure Tailwind CSS
  - [x] Set up Clerk (sign-up, login, social-auth-ready UI)
  - [x] Route protection via `src/proxy.ts` (public: `/`, `/sign-in`, `/sign-up`)
- [ ] Day 2 — Database & backend setup
- [x] **Day 3 — User dashboard & profile**
  - [x] Build a responsive rider dashboard with account overview and empty ride-history states
  - [x] Add profile editing for name and profile photo using Clerk
  - [x] Add phone-number setup with SMS verification
  - [x] Protect the profile route through the existing Clerk proxy
- [ ] **Day 4 — Map & ride request system**
  - [x] Add Visakhapatnam pickup/drop-off selection, route preview, ride categories, and INR fare estimates
  - [x] Prototype ride requests, cancellation, and reference states (superseded by account-scoped persistence on Day 11)
  - [x] Use OpenStreetMap tiles without an API key or credit card, with an offline illustration fallback and an approximate route overlay
  - [x] Persist ride requests through the authenticated SQLite API; fares and distances are recalculated server-side
- [ ] **Day 5 — Driver dashboard & ride matching**
  - [x] Add a protected driver view with online/offline state and a nearby-request queue
  - [x] Rank demo offers by estimated pickup distance; accept or pass on requests
  - [x] Add accepted → in-progress → completed trip actions with same-browser-tab updates
  - [ ] Replace browser-local demo matching with authenticated, server-side driver matching after Day 2 backend setup
- [ ] **Day 6 — Real-time updates & notifications (prototype)**
  - [x] Broadcast ride state changes between same-origin tabs with BroadcastChannel and a storage-event fallback
  - [x] Add an animated in-app notification center for requests, driver matches, cancellations, and trip status
  - [ ] Replace browser-local events with server-backed WebSockets/Firebase and push notifications after Day 2 backend setup
- [x] **Day 7 — Buffer day & testing**
  - [x] Add unit coverage for ride distance/fare formatting, driver offer ranking, ride lifecycle transitions, and in-app notifications
  - [x] Run lint, unit tests, and production builds in GitHub Actions for pushes and pull requests
- [x] **Day 8 — Ride history & dashboard summaries**
  - [x] Add a protected ride history page with status filters, search, route details, and fare estimates
  - [x] Show live ride counts and recent requests on the signed-in dashboard
  - [x] Scope ride history and dashboard summaries to the signed-in user
- [x] **Day 9 — Ride reviews**
  - [x] Let riders rate completed demo trips from one to five stars with an optional short note
  - [x] Restrict reviews to completed rides and allow one review per trip
  - [x] Persist one review per completed ride on the signed-in user's ride record
- [x] **Day 10 — SQLite backend foundation (local prototype)**
  - [x] Add a Drizzle ORM schema and file-backed SQLite database at `data/cabbook.sqlite` (no hosted account or card required)
  - [x] Add Clerk-authenticated, user-scoped ride list/create/update API endpoints; derive ownership from the signed-in session and recompute fare/distance server-side
  - [x] Add in-memory SQLite tests for owner isolation and ride updates
- [x] **Day 11 — Client ride persistence**
  - [x] Connect booking, cancellation, demo driver lifecycle, ride history, and reviews to authenticated, owner-scoped ride endpoints
  - [x] Keep notifications browser-local and synchronized between same-origin tabs, namespaced per signed-in user
  - [x] Leave legacy unscoped browser rides untouched and unimported to avoid assigning one person's location history to another account
- [x] **Day 12 — Ride freshness & payment guardrails**
  - [x] Refresh the signed-in ride list when a page becomes visible or regains focus, so server changes show across devices without a manual reload
  - [x] State clearly that fares are estimates and no payment is collected; do not request or store card details
  - [x] Defer real payment processing until a server-backed provider and deployment database strategy are selected
- [ ] Days 13–14 — Deployment readiness and final polish

## Getting started

```bash
npm ci
cp .env.local.example .env.local   # then fill in your Clerk keys locally
npm run db:migrate                 # create/update data/cabbook.sqlite
npm run dev                        # http://localhost:3000
```

For schema changes, run `npm run db:generate`, then `npm run db:migrate`. `npm run db:studio` opens Drizzle Studio. To use a non-default database file, set `CABBOOK_DATABASE_PATH` in your shell before both the migration and dev commands.

The local SQLite API uses Drizzle ORM with the `better-sqlite3` adapter and writes to `data/cabbook.sqlite` by default (or to `CABBOOK_DATABASE_PATH` if set). Ride requests, status transitions, and reviews are persisted per signed-in Clerk user. Browser-local notifications remain device-local and sync between same-origin tabs; their storage is separated by user. Legacy rides under the old unscoped browser-storage key are left untouched and are not automatically imported or shown, because the app cannot safely determine which account owns them. This avoids assigning personal location history to the wrong account; the legacy data remains in the browser but is not available in the account ride-history UI, and no automatic migration or in-app export is provided. The database file is git-ignored. This is intended for local development or a server with a persistent writable disk; ephemeral/serverless deployments need a hosted database or persistent volume.

### Clerk setup (one-time)

1. Create an application at <https://dashboard.clerk.com>.
2. Copy the **Publishable key** and **Secret key** into `.env.local`.
3. Under **User & Authentication → Social connections**, enable the providers you want (e.g. Google, GitHub). The `<SignIn />` and `<SignUp />` components pick them up automatically.
4. Under **Configure → Paths** (or via the env vars), sign-in/up URLs are `/sign-in` and `/sign-up`; after auth users land on `/dashboard`.
5. To use profile editing, allow name updates in the Clerk profile settings. To verify phone numbers, enable phone-number sign-in/verification and SMS delivery in the Clerk Dashboard.

## Project structure (through Day 12)

```
src/
├─ app/
│  ├─ layout.tsx                 # ClerkProvider + global navbar
│  ├─ page.tsx                   # Public landing page
│  ├─ globals.css                # Tailwind CSS entry
│  ├─ sign-in/[[...sign-in]]/page.tsx
│  ├─ sign-up/[[...sign-up]]/page.tsx
│  ├─ dashboard/page.tsx         # Rider dashboard
│  ├─ profile/page.tsx           # Protected profile settings
│  ├─ book/page.tsx              # Protected ride planner
│  ├─ driver/page.tsx            # Protected demo driver dashboard
│  ├─ history/page.tsx           # Protected account-scoped ride history and reviews
│  └─ api/rides/
│     ├─ route.ts                # Authenticated ride list and creation
│     └─ [rideId]/route.ts       # Owner-scoped ride transitions and reviews
├─ components/
│  ├─ Navbar.tsx                 # Auth controls and signed-in navigation
│  ├─ ProfileEditor.tsx          # Name, phone verification, and photo editor
│  ├─ BookingExperience.tsx      # Stops, ride choice, fare, and demo request
│  ├─ RideMap.tsx                # OpenStreetMap with offline illustration fallback
│  ├─ OpenStreetMapView.tsx      # Leaflet tiles, route line, and pickup markers
│  ├─ DriverExperience.tsx       # Demo ride matching and lifecycle controls
│  ├─ NotificationBell.tsx       # Cross-tab in-app ride notification center
│  ├─ DashboardRideSummary.tsx   # Live dashboard ride counts and recent requests
│  └─ RideHistoryExperience.tsx  # Searchable account-scoped ride history and estimates
├─ lib/
│  ├─ ride.ts                    # Locations, fare estimates, and offer ranking
│  ├─ ride-storage.ts            # Same-origin rides, notifications, and sync
│  └─ server/ride-database.ts    # Local SQLite persistence scoped by Clerk user
└─ proxy.ts                      # Clerk middleware (Next.js 16 "proxy" file)
tests/
├─ ride.test.ts                  # Fare, distance, formatting, and offer ranking
├─ ride-storage.test.ts          # Ride lifecycle, notifications, and local reviews
├─ ride-database.test.ts         # SQLite storage and user-isolation checks
└─ ride-api.test.ts              # Client/API lifecycle, review, and owner-isolation integration
drizzle.config.ts                # Drizzle Kit SQLite configuration
drizzle/                         # Generated SQL migrations and migration journal
```

## Scripts

| Command         | What it does                     |
| --------------- | -------------------------------- |
| `npm run dev`   | Start the dev server             |
| `npm run build` | Production build                 |
| `npm run start` | Serve the production build       |
| `npm run lint`  | Run ESLint                       |
| `npm test`      | Run ride logic, storage, and signed-in API flow tests |
| `npm run db:generate` | Generate a Drizzle SQL migration |
| `npm run db:migrate` | Apply pending migrations to SQLite |
| `npm run db:studio` | Open Drizzle Studio for the local database |
