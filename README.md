# Group Trip Planner

A full-stack web app for planning trips with a group — propose and vote on destinations and dates, track a shared budget, build a day-by-day itinerary, and split expenses with automatic debt settlement.

## Features

- **Trips & membership** — create a trip, invite friends by email via a signed, expiring token (`/invite/[token]`). Two roles: **Owner** (full control) and **Member** (participate).
- **Destination voting** — propose destinations (auto-geocoded via OpenStreetMap), vote one-per-user-per-poll, see live tallies on a map (Leaflet), owner finalizes the pick.
- **Date voting** — same one-vote model applied to candidate date ranges.
- **Budget** — owner defines categories with planned amounts; dashboard shows planned vs. actual spend per category.
- **Itinerary** — day-by-day items with drag-and-drop reordering within a day.
- **Expenses & settlement** — log expenses with equal/exact/percentage splits, view each member's net balance, and get a minimal "who pays whom" settlement plan (greedy debt simplification) instead of a raw N×N matrix.
- **Dashboard** — one page per trip summarizing status, finalized/leading destination & dates, budget, upcoming itinerary, recent expenses, and outstanding settlements.
- **Auth** — email/password and Google OAuth, both backed by revocable database sessions (not just JWTs), plus forgot/reset password.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Neon / Vercel Postgres) |
| ORM | Prisma |
| Auth | Auth.js (NextAuth v5) |
| Maps | Leaflet + react-leaflet + OpenStreetMap Nominatim |
| Testing | Vitest |
| Deployment | Vercel |

## Architecture

- **Server-first**: Server Components by default; `"use client"` only where interactivity is required (voting, forms, drag-and-drop).
- **Server Actions** for simple mutations (voting, expenses, itinerary), **Route Handlers** for anything needing custom client-side status codes (e.g. invitations).
- **Centralized authorization** (`lib/auth/permissions.ts`): every mutation checks session, trip membership, and role server-side — never trusts the client. Non-members hit `notFound()` rather than a distinguishable 403, so trip IDs can't be enumerated.
- **Services layer** (`lib/services/`): components call actions, actions call services, services call Prisma — keeps business logic out of components and testable in isolation.
- **Money as integers**: stored as Prisma `Decimal`, computed as integer cents in application code to avoid floating-point rounding errors across expense splits.
- **Voting integrity**: one vote per user per poll enforced by a DB unique constraint (not just app logic), so it holds under concurrent requests.

See [CLAUDE.md](CLAUDE.md) for the full product spec, data model, and a running decisions log of every non-obvious implementation choice.

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (this project is built against [Neon](https://neon.tech), which provides both a pooled and direct connection string)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and fill in your values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Purpose |
   |---|---|
   | `DATABASE_URL` | Pooled Postgres connection, used at runtime |
   | `DIRECT_URL` | Direct (non-pooled) connection, used by Prisma Migrate |
   | `NEXTAUTH_URL` | Base URL of the app (`http://localhost:3000` in dev) — also used for invite/reset links and cookie security, so keep it accurate per environment |
   | `NEXTAUTH_SECRET` | Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |

3. Run migrations and generate the Prisma client:

   ```bash
   npx prisma migrate dev
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Other scripts

```bash
npm run build   # runs `prisma migrate deploy` then builds — matches the Vercel build step
npm run lint     # eslint
npm run test     # vitest (unit tests cover the settlement/debt-simplification and split-calculation logic)
```

## Project Structure

```
app/
  (auth)/            # sign-in, sign-up, forgot/reset password
  (dashboard)/
    trips/
      [tripId]/       # membership-guarded layout + dashboard, destinations, dates,
                       # budget, itinerary, expenses, members, settings
  invite/[token]/     # accept-invitation flow (works logged-out)
  api/                # auth handlers + invite creation route
lib/
  auth/               # permissions, session helpers, credentials/password logic
  validation/         # Zod schemas (shared client/server)
  services/           # business logic per domain (trips, voting, budget, itinerary, expenses, ...)
  db.ts               # Prisma client singleton
components/
  ui/                 # generic reusable components (Button, Card, Modal, ...)
  voting/ budget/ itinerary/ expenses/ trips/
prisma/
  schema.prisma
  migrations/
```

## Deployment

Deployed on Vercel. The build step runs `prisma migrate deploy` before `next build` so schema migrations apply automatically on deploy. Point `DATABASE_URL`/`DIRECT_URL` at your production Postgres instance and set the same env vars as above (with `NEXTAUTH_URL` matching your production domain).
