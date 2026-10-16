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
  - [x] Save demo ride requests in browser storage, with cancel and reference states
  - [x] Add a Google Maps route view when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is configured; show the interactive map illustration otherwise
  - [ ] Connect requests and live route/fare estimates to a backend after the Day 2 database is selected
- [ ] Day 5 — Driver dashboard & ride matching
- [ ] Day 6 — Real-time updates & notifications (optional)
- [ ] Day 7 — Buffer day & testing
- [ ] Day 8–14 — Payments, history, reviews, polish, deployment

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in your Clerk keys
npm run dev                        # http://localhost:3000
```

### Clerk setup (one-time)

1. Create an application at <https://dashboard.clerk.com>.
2. Copy the **Publishable key** and **Secret key** into `.env.local`.
3. Under **User & Authentication → Social connections**, enable the providers you want (e.g. Google, GitHub). The `<SignIn />` and `<SignUp />` components pick them up automatically.
4. Under **Configure → Paths** (or via the env vars), sign-in/up URLs are `/sign-in` and `/sign-up`; after auth users land on `/dashboard`.
5. To use profile editing, allow name updates in the Clerk profile settings. To verify phone numbers, enable phone-number sign-in/verification and SMS delivery in the Clerk Dashboard.

## Project structure (through Day 4 prototype)

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
│  └─ book/page.tsx              # Protected ride planner
├─ components/
│  ├─ Navbar.tsx                 # Auth controls and signed-in navigation
│  ├─ ProfileEditor.tsx          # Name, phone verification, and photo editor
│  ├─ BookingExperience.tsx      # Stops, ride choice, fare, and demo request
│  ├─ RideMap.tsx                # Google Maps view or interactive local map
│  └─ GoogleMapsView.tsx         # Optional live Google Maps integration
└─ proxy.ts                      # Clerk middleware (Next.js 16 "proxy" file)
```

## Scripts

| Command         | What it does                     |
| --------------- | -------------------------------- |
| `npm run dev`   | Start the dev server             |
| `npm run build` | Production build                 |
| `npm run start` | Serve the production build       |
| `npm run lint`  | Run ESLint                       |
