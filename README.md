# CabBook — Uber-style Cab Booking App

Full-stack ride-hailing app built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Clerk** for authentication. The interface uses **Motion for React** for interaction and reveal animations, plus **next-themes** for persistent light/dark mode.

## Progress

- [x] **Day 1 — Project setup & authentication**
  - [x] Initialize Next.js project (TypeScript, App Router, `src/` dir, ESLint)
  - [x] Install and configure Tailwind CSS
  - [x] Set up Clerk (sign-up, login, social-auth-ready UI)
  - [x] Route protection via `src/proxy.ts` (public: `/`, `/sign-in`, `/sign-up`)
- [x] Day 2 — Database & backend setup (completed with the Day 10 SQLite foundation)
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
  - [x] Add accepted → in-progress → completed demo trip actions (server-backed across rider and driver accounts on Day 15)
  - [x] Replace browser-local offers with allow-listed, authenticated SQLite matching (Day 15)
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
- [x] **Day 13 — Portable container deployment readiness**
  - [x] Build a production-only Next.js standalone container and Compose service
  - [x] Persist SQLite data on a named volume and create missing database directories at runtime
  - [x] Keep the Clerk secret out of image build arguments; inject it only into the running container
  - [x] Add a database-backed readiness endpoint and container health check
  - [x] Document self-hosted setup, backups, and local SQLite/OSM operational limits
- [x] **Day 14 — Final polish and release verification**
  - [x] Exclude the database readiness endpoint from Clerk middleware and return explicit `no-store` responses
  - [x] Test both healthy and unavailable SQLite readiness states without leaking database errors
  - [x] Capture and review production UI screenshots in light, dark, and mobile layouts; record the live readiness endpoint capture
  - [x] Re-run ride, driver, booking, review, history, routing, and deployment checks
- [x] **Day 15 — Server-side driver matching**
  - [x] Add SQLite ownership for claimed driver rides and serialize concurrent claims
  - [x] Restrict driver pages and APIs to Clerk IDs in the server-side `CABBOOK_DRIVER_USER_IDS` allow-list
  - [x] Share requested offers across rider accounts while excluding a driver’s own requests
  - [x] Move accept/pass/start/complete actions to dedicated driver endpoints and refresh offers every 15 seconds
  - [x] Keep rider cancellation and review actions owner-scoped; document setup and demo limits

## Getting started

```bash
npm ci
cp .env.local.example .env.local   # then fill in your Clerk keys locally
npm run db:migrate                 # create/update data/cabbook.sqlite
npm run dev                        # http://localhost:3000
```

For schema changes, run `npm run db:generate`, then `npm run db:migrate`. `npm run db:studio` opens Drizzle Studio. To use a non-default database file, set `CABBOOK_DATABASE_PATH` in your shell before both the migration and dev commands.

The local SQLite API uses Drizzle ORM with the `better-sqlite3` adapter and writes to `data/cabbook.sqlite` by default (or to `CABBOOK_DATABASE_PATH` if set). Ride requests, status transitions, and reviews are persisted per signed-in Clerk user. Browser-local notifications remain device-local and sync between same-origin tabs; their storage is separated by user. Legacy rides under the old unscoped browser-storage key are left untouched and are not automatically imported or shown, because the app cannot safely determine which account owns them. This avoids assigning personal location history to the wrong account; the legacy data remains in the browser but is not available in the account ride-history UI, and no automatic migration or in-app export is provided. The database file is git-ignored. The self-hosted container stores it on a named Docker volume. This is intended for local development or a single server with a persistent writable disk; ephemeral/serverless deployments need a hosted database or persistent volume. Back up the SQLite volume regularly, and stop writes or use a SQLite-consistent backup procedure when taking a copy. SQLite is a single-instance prototype backend, not a highly available or multi-replica database.

### Self-host with Docker Compose

Requires Docker Engine and the Docker Compose plugin. Keep Clerk credentials outside the image and source control:

```bash
cp .env.local.example .env
# Fill in the Clerk keys in .env using a secure editor/secret manager.
docker compose up --build -d
docker compose ps
```

Compose passes `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` as a build argument because Next.js embeds the public key into the client bundle. `CLERK_SECRET_KEY` is supplied only to the running container, never as a Docker build argument. The container applies Drizzle migrations when it first opens the database, stores SQLite data in the persistent `cabbook-data` volume, and exposes `/api/health/ready` for database readiness. Set `HOST_PORT` in `.env` to change the host port. Use `docker compose logs -f web` to inspect service logs, `docker compose down` to stop it without deleting data, and `docker volume ls` to locate the database volume. `docker compose down -v` permanently deletes that volume and its ride data.

To enable the demo driver dashboard, set `CABBOOK_DRIVER_USER_IDS` to a comma-separated allow-list of Clerk user IDs in `.env.local` (local development) or `.env` (Compose). An empty value disables driver access. Only listed accounts can view `/driver` or use `/api/driver/rides`; the allow-list stays server-side. The demo queue is shared across rider accounts, prevents drivers from accepting their own requests, atomically assigns each offer to one driver, and polls for new offers every 15 seconds. This is not real dispatch or push messaging.

Terminate public HTTPS at a maintained reverse proxy or load balancer; do not expose the app directly to the internet without TLS and appropriate network controls. Set secure backups and recovery before relying on stored rides. The public OpenStreetMap tile service is best-effort and intended for light use; production traffic may require a tile provider or self-hosted tiles. This portable setup is not a deployment to a hosting provider, and it does not provide horizontal scaling, automated backups, monitoring, or payment processing.

### Clerk setup (one-time)

1. Create an application at <https://dashboard.clerk.com>.
2. Copy the **Publishable key** and **Secret key** into `.env.local`.
3. Under **User & Authentication → Social connections**, enable the providers you want (e.g. Google, GitHub). The `<SignIn />` and `<SignUp />` components pick them up automatically.
4. Under **Configure → Paths** (or via the env vars), sign-in/up URLs are `/sign-in` and `/sign-up`; after auth users land on `/dashboard`.
5. To use profile editing, allow name updates in the Clerk profile settings. To verify phone numbers, enable phone-number sign-in/verification and SMS delivery in the Clerk Dashboard.

## Project structure (through Day 14)

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
│  ├─ driver/page.tsx            # Driver dashboard gated by the server allow-list
│  ├─ history/page.tsx           # Protected account-scoped ride history and reviews
│  └─ api/
│     ├─ health/ready/route.ts   # Public database readiness check
│     ├─ rides/
│     │  ├─ route.ts             # Authenticated ride list and creation
│     │  └─ [rideId]/route.ts    # Owner-scoped rider cancellation and reviews
│     └─ driver/rides/
│        ├─ route.ts             # Allow-listed shared driver offer queue
│        └─ [rideId]/route.ts    # Atomic driver accept/pass/start/complete
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
│  ├─ ride-storage.ts            # Rider rides, notifications, and sync
│  ├─ driver-storage.ts          # Shared offer polling and driver actions
│  └─ server/
│     ├─ driver-access.ts        # Server-only Clerk ID allow-list
│     ├─ ride-database.ts        # Rider-owned rides and atomic driver claims
│     └─ schema.ts               # Drizzle SQLite schema
└─ proxy.ts                      # Clerk middleware (Next.js 16 "proxy" file)
tests/
├─ driver-access.test.ts         # Explicit Clerk driver-ID allow-list behavior
├─ health-ready.test.ts          # Uncached readiness success/failure without database detail leaks
├─ ride.test.ts                  # Fare, distance, formatting, and offer ranking
├─ ride-storage.test.ts          # Ride lifecycle, notifications, and local reviews
├─ ride-database.test.ts         # SQLite storage, ownership, and atomic driver claims
└─ ride-api.test.ts              # Rider + driver API lifecycle and isolation integration
artifacts/day13/                 # Readiness endpoint and inspected light/dark/mobile UI captures
artifacts/day14/                 # Final readiness and UI verification captures
artifacts/day15/                 # Shared-driver queue UI and API captures
drizzle.config.ts                # Drizzle Kit SQLite configuration
drizzle/                         # Generated SQL migrations and migration journal
Dockerfile                       # Multi-stage production standalone image
docker-compose.yml               # Self-hosted app, health check, and persistent volume
scripts/prepare-standalone.mjs   # Include static assets and SQL migrations in standalone output
```

## Scripts

| Command         | What it does                     |
| --------------- | -------------------------------- |
| `npm run dev`   | Start the dev server             |
| `npm run build` | Production build                 |
| `npm run start` | Run the production standalone server |
| `npm run lint`  | Run ESLint                       |
| `npm test`      | Run ride logic, storage, driver authorization, and signed-in API flow tests |
| `npm run db:generate` | Generate a Drizzle SQL migration |
| `npm run db:migrate` | Apply pending migrations to SQLite |
| `npm run db:studio` | Open Drizzle Studio for the local database |
