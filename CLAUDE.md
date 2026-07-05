@AGENTS.md

# [claude.md](http://claude.md) — Group Trip Planner

This file is the source of truth for how this project is built. Read it before generating code. If a decision here conflicts with a request in chat, prefer this file unless the user explicitly says to deviate, and if you do deviate, update this file in the same turn.

---

## 1. Product Overview

**Group Trip Planner** is a full-stack web app that helps groups plan trips together in one shared place.

Core jobs the product does:

1. Let a user create a trip and invite friends to it.
2. Let trip members vote on candidate destinations.
3. Let trip members vote on candidate date ranges.
4. Track a shared trip budget.
5. Manage an itinerary (day-by-day activities/items).
6. Track and split expenses among members, and show who owes whom.
7. Summarize all of the above on a single trip dashboard.

This is not a toy CRUD app. Every feature below should be built with real product behavior: empty states, loading states, optimistic-but-correct UI updates, permission checks on every mutation, and data models that hold up under concurrent edits (two people voting at once, two people adding expenses at once).

---

## 2. Tech Stack (fixed — do not substitute without discussion)


| Layer      | Choice                   |
| ---------- | ------------------------ |
| Framework  | Next.js (App Router)     |
| Language   | TypeScript (strict mode) |
| Styling    | Tailwind CSS             |
| Database   | PostgreSQL               |
| ORM        | Prisma                   |
| Auth       | Auth.js (NextAuth)       |
| Deployment | Vercel                   |


Implied choices that follow from the stack, unless overridden:

- **API style**: Next.js Route Handlers (`app/api/.../route.ts`) for REST-ish endpoints, plus Server Actions for form-style mutations from Server Components. Prefer Server Actions for simple mutations (vote, add expense) and Route Handlers for anything that needs to be called from client-side fetch with custom status codes (e.g., invite acceptance flows).
- **Validation**: Zod, shared between client forms and server-side parsing. One schema per resource, colocated in `lib/validation/`.
- **Database hosting**: Vercel Postgres or Neon (serverless Postgres) — both work with Prisma's connection pooling pattern needed for serverless functions. Use `DATABASE_URL` (pooled) and `DIRECT_URL` (for migrations) as separate env vars.
- **Session strategy**: Database sessions (not pure JWT) via the Auth.js Prisma adapter, so sessions can be revoked server-side and role lookups stay fresh. **Caveat**: Auth.js's Credentials provider does not support the `database` session strategy natively (a documented library limitation — it's JWT-only). To keep database sessions for *both* Google and email/password login, the credentials flow bypasses Auth.js's built-in sign-in path: `lib/auth/credentials.ts` verifies the password directly, then manually creates a `Session` row and sets the same `authjs.session-token` cookie Auth.js itself would set (name, value format, and options mirrored from `@auth/core`'s `defaultCookies()`), so `auth()`/`proxy.ts`/`signOut()` treat it identically to an Auth.js-issued session. There is no Auth.js `CredentialsProvider` registered in `auth.ts` — only `Google`.

---

## 3. Architecture Principles

- **Server-first**: Default to Server Components. Only mark a component `"use client"` when it needs interactivity (forms, voting buttons, optimistic UI, drag-and-drop itinerary reordering).
- **Authorization lives in one place**: Every mutation (Server Action or Route Handler) must call a shared authorization helper (`lib/auth/permissions.ts`) before touching the database. Never trust a role passed from the client. Never assume a session user is a trip member — always check membership against the DB for the specific `tripId` in the request.
- **No business logic in components**: Components render and call actions. Actions call services. Services call Prisma. This keeps logic testable and keeps API routes thin.
- **Folder layout (suggested)**: 
  ```
    app/
      (auth)/
        sign-in/
        sign-up/
      (dashboard)/
        trips/
          page.tsx                  // list of user's trips
          new/                      // create-trip form
          [tripId]/
            layout.tsx              // membership guard (notFound() for non-members) + trip nav
            page.tsx                // trip dashboard (start-voting / finalize panels live here)
            actions.ts              // startVotingAction, finalizeTripAction
            destinations/           // propose + vote on destinations (actions.ts + page.tsx)
            dates/                  // propose + vote on date ranges (actions.ts + page.tsx)
            budget/                 // owner-only category CRUD (actions.ts + page.tsx)
            itinerary/              // member CRUD + drag-and-drop reorder (actions.ts + page.tsx)
            expenses/
            members/                // list/invite/remove
            settings/                // owner-only edit + delete
      invite/
        [token]/page.tsx           // accept-invitation flow (outside (dashboard) — must work logged-out)
        actions.ts
      api/
        auth/[...nextauth]/route.ts
        trips/[tripId]/invite/route.ts   // POST: owner creates an invitation
        webhooks/...
    lib/
      auth/
        permissions.ts             // role + membership checks (requireUser/requireTripMembership/requireTripOwner)
        session.ts                 // getServerSession wrapper
        credentials.ts             // password hash/verify + manual DB session creation (see §10 caveat)
      validation/                  // zod schemas
      services/                    // business logic per domain — trips.ts, invitations.ts, email.ts, voting.ts, budget.ts, itinerary.ts so far
      db.ts                        // Prisma client singleton
    components/
      ui/                          // generic, reusable (Button, Card, Modal, etc.)
      trips/
      voting/
      budget/
      itinerary/
      expenses/
    prisma/
      schema.prisma
      migrations/
    types/
  ```
  Plus two project-root files required by their respective libraries: `auth.ts` (Auth.js v5 config — `handlers`/`auth`/`signIn`/`signOut`) and `proxy.ts` (Next.js 16's route-protection convention; see §6.1).
- **Type safety end to end**: Prisma generates types for the DB layer; Zod schemas generate types for input validation; never use `any`. Shared domain types (e.g., `TripWithMembers`) live in `types/` and are derived from Prisma's `Prisma.TripGetPayload<...>` helpers rather than hand-duplicated.

---

## 4. Roles & Permissions

Two roles per trip — confirmed, no third role at launch:

- **OWNER**: the user who created the trip. Can: edit trip details, delete the trip, remove members, change member roles, close voting, finalize destination/dates, manage budget categories.
- **MEMBER**: an invited, accepted participant. Can: vote on destinations/dates, add itinerary items, add/edit their own expenses, view everything on the dashboard.

Rules to enforce server-side, always:

- A user is only a "member" of a trip if a `TripMembership` row exists for `(userId, tripId)` with status `ACCEPTED`.
- Only the OWNER can: delete a trip, remove another member, promote/demote roles, lock voting, delete *any* expense (members can only delete/edit their own).
- A non-member must get a 403/redirect on every trip subroute, not just the dashboard page — check at the layout level (`app/(dashboard)/trips/[tripId]/layout.tsx`) AND re-check in every Server Action, since layout checks alone don't protect direct Server Action calls.
- Invitations are accepted via a unique token, not by trip ID guessing.

---

## 5. Data Model (Prisma schema — conceptual)

This is the intended shape. Treat it as the contract; flag to the user if a feature request implies a schema change.

```prisma
model User {
  id            String   @id @default(cuid())
  name          String?
  email         String   @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime @default(now())

  accounts      Account[]
  sessions      Session[]
  memberships   TripMembership[]
  destinationVotes DestinationVote[]
  dateVotes        DateOptionVote[]
  expensesPaid     Expense[]        @relation("ExpensePayer")
  expenseShares    ExpenseShare[]
  itineraryItemsCreated ItineraryItem[] @relation("ItineraryCreator")
}

model Trip {
  id          String   @id @default(cuid())
  name        String
  description String?
  coverImage  String?
  currency    String   @default("USD") // ISO 4217 code; all amounts on this trip are stored in this currency
  status      TripStatus @default(PLANNING)
  finalDestinationId String?  // set once voting is finalized
  finalStartDate     DateTime?
  finalEndDate       DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  memberships     TripMembership[]
  invitations     TripInvitation[]
  destinations    DestinationOption[]
  dateOptions     DateOption[]
  budgetCategories BudgetCategory[]
  itineraryItems  ItineraryItem[]
  expenses        Expense[]
}

enum TripStatus {
  PLANNING
  VOTING
  FINALIZED
  COMPLETED
  ARCHIVED
}

model TripMembership {
  id        String   @id @default(cuid())
  tripId    String
  userId    String
  role      TripRole @default(MEMBER)
  status    MembershipStatus @default(ACCEPTED)
  joinedAt  DateTime @default(now())

  trip      Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([tripId, userId])
}

enum TripRole {
  OWNER
  MEMBER
}

enum MembershipStatus {
  INVITED
  ACCEPTED
  DECLINED
}

model TripInvitation {
  id        String   @id @default(cuid())
  tripId    String
  email     String
  token     String   @unique
  invitedBy String
  status    MembershipStatus @default(INVITED)
  expiresAt DateTime
  createdAt DateTime @default(now())

  trip      Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)
}

model DestinationOption {
  id          String  @id @default(cuid())
  tripId      String
  name        String
  notes       String?
  imageUrl    String?
  proposedBy  String
  createdAt   DateTime @default(now())

  trip        Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)
  votes       DestinationVote[]
}

model DestinationVote {
  id            String @id @default(cuid())
  destinationId String
  userId        String
  createdAt     DateTime @default(now())

  destination   DestinationOption @relation(fields: [destinationId], references: [id], onDelete: Cascade)
  user          User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([destinationId, userId]) // one vote per user per option
}

model DateOption {
  id        String   @id @default(cuid())
  tripId    String
  startDate DateTime
  endDate   DateTime
  proposedBy String
  createdAt DateTime @default(now())

  trip      Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)
  votes     DateOptionVote[]
}

model DateOptionVote {
  id           String @id @default(cuid())
  dateOptionId String
  userId       String
  createdAt    DateTime @default(now())

  dateOption   DateOption @relation(fields: [dateOptionId], references: [id], onDelete: Cascade)
  user         User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([dateOptionId, userId])
}

model BudgetCategory {
  id          String  @id @default(cuid())
  tripId      String
  name        String       // e.g. "Lodging", "Food", "Activities"
  plannedAmount Decimal    @db.Decimal(10, 2)

  trip        Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)
  expenses    Expense[]
}

model ItineraryItem {
  id          String   @id @default(cuid())
  tripId      String
  title       String
  description String?
  location    String?
  startTime   DateTime?
  endTime     DateTime?
  dayIndex    Int        // for ordering within the trip
  createdById String
  createdAt   DateTime @default(now())

  trip        Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)
  createdBy   User @relation("ItineraryCreator", fields: [createdById], references: [id])
}

model Expense {
  id          String   @id @default(cuid())
  tripId      String
  categoryId  String?
  description String
  amount      Decimal  @db.Decimal(10, 2)
  paidById    String
  splitType   SplitType @default(EQUAL)
  createdAt   DateTime @default(now())

  trip        Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)
  category    BudgetCategory? @relation(fields: [categoryId], references: [id])
  paidBy      User @relation("ExpensePayer", fields: [paidById], references: [id])
  shares      ExpenseShare[]
}

enum SplitType {
  EQUAL
  EXACT_AMOUNT
  PERCENTAGE
}

model ExpenseShare {
  id         String  @id @default(cuid())
  expenseId  String
  userId     String
  amountOwed Decimal @db.Decimal(10, 2)

  expense    Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  user       User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([expenseId, userId])
}

```

Notes on design decisions baked into this schema:

- **Money is** `Decimal`**, never** `Float`**.** Floating point for currency causes real bugs (rounding errors compound across expense splits). Use `Decimal.js` or Prisma's `Decimal` type consistently; never cast to JS `number` for arithmetic, only for display after rounding.
- **One stored currency per trip (**`Trip.currency`**).** All `Expense.amount`, `BudgetCategory.plannedAmount`, and `ExpenseShare.amountOwed` values are stored in this single currency — there is no per-expense currency field and no historical exchange-rate tracking. "Switching currency" is a display-only conversion (see 6.4a); changing `Trip.currency` itself just relabels the unit going forward and does not convert existing stored amounts.
- `ExpenseShare` **stores computed amounts, not percentages**, even when `splitType` is `PERCENTAGE` or `EQUAL`. Compute once at creation time and persist the result, so historical expenses don't silently change if someone is removed from the trip later.
- **Voting is one-vote-per-user-per-option**, enforced by a DB unique constraint, not just app logic — this is the kind of invariant that must live in the schema so it holds even under concurrent requests.
- `Trip.status` drives UI: voting UI only shows while `status = VOTING`; once `FINALIZED`, voting locks and the dashboard shows the chosen destination/dates instead of live tallies.

---

## 6. Feature Specs

### 6.1 Authentication

- Auth.js with the Prisma adapter, database sessions (see the caveat in §2 — credentials login creates its database session manually, outside Auth.js's own sign-in path).
- Support email/password (with hashed passwords via `bcryptjs` — chosen over `bcrypt` to avoid native/node-gyp build issues in this environment; same hashing algorithm, drop-in API) AND at least one OAuth provider (Google) — credentials alone is a weak default for a "real product" feel.
- Protect all `(dashboard)` routes via `proxy.ts` (**not** `middleware.ts` — Next.js 16 deprecated and renamed the `middleware` file convention to `proxy`; same `(request, event) => Response` contract, default export, and `config.matcher`) checking for a valid session; redirect unauthenticated users to `/sign-in` with a `callbackUrl`.
- **Forgot password**: `/forgot-password` (email form) → `lib/auth/credentials.ts#createPasswordResetToken` issues a token stored in the existing `VerificationToken` model (`identifier` = email; no dedicated table needed) → stubbed email (`lib/services/email.ts#sendPasswordResetEmail`, console.log like invitations) links to `/reset-password/[token]`. Resetting invalidates all of that user's existing `Session` rows and signs them in fresh on the new password (see §10). Always show a generic "check your email" response from the forgot-password form regardless of whether the account exists, to avoid email enumeration.

### 6.2 Trip Creation & Membership

- Creating a trip auto-creates a `TripMembership` with role `OWNER` for the creator.
- Invitations: owner enters an email → creates a `TripInvitation` with a signed token → sends an email (stub this with a console-log or Resend integration; don't block on email infra) → recipient clicks a link `/invite/[token]` → if they have an account, accept directly; if not, sign up first, then auto-accept.

### 6.3 Destination & Date Voting

- Any member can propose a destination option or date option while `Trip.status = VOTING`.
- Each member gets exactly one vote per poll (destination poll, date poll) — voting again moves their vote rather than adding a second one (toggle/replace, enforced by the unique constraint plus an upsert).
- Show live vote counts and which members voted for which option (transparency aids group decisions — don't make this anonymous unless asked).
- Owner can "finalize" — locks `Trip.status` to `FINALIZED`, sets `finalDestinationId`/`finalStartDate`/`finalEndDate` from the current leading options (owner can override the leading option manually before confirming).

### 6.4 Budget

- Owner defines budget categories with planned amounts.
- Dashboard shows planned vs. actual (sum of `Expense.amount` per category) with a simple progress bar per category and an overall trip total.

### 6.4a Currency Display

- A trip has exactly one stored currency (`Trip.currency`), set at creation and changeable by the owner in trip settings.
- All amounts in the database (expenses, budget categories, shares) are always in `Trip.currency` — there is no per-expense currency and no stored exchange-rate history.
- Each user can set a **personal preferred display currency** (a simple client-side/profile preference, not tied to the trip). When set, dashboard and expense amounts are converted for display only, using a live or cached exchange rate (e.g. via a free FX API, cached for a reasonable interval like 1 hour to avoid rate-limit issues).
- Always show the original stored amount/currency alongside or via tooltip when displaying a converted amount, so it's clear the converted figure is informational, not authoritative.
- This is a view-layer concern only — no Prisma schema changes needed beyond `Trip.currency` itself. Implement as a `useDisplayCurrency()` hook / context that wraps amount-rendering components.

### 6.5 Itinerary

- Members can add itinerary items with day/time/location.
- Group by `dayIndex` for a day-by-day view; allow drag-and-drop reordering within a day (client component, persists new `dayIndex`/order on drop).

### 6.6 Expense Splitting

- Adding an expense: payer, amount, description, optional category, split type, and which members are included in the split.
- `EQUAL`: divide amount evenly among included members (handle remainder cents deterministically — e.g., first N members get the extra cent, don't just truncate and lose money).
- `EXACT_AMOUNT` / `PERCENTAGE`: validate that shares sum to the total amount (or 100%) before saving; reject otherwise with a clear validation error.
- **Balances view**: compute net balance per member (paid − owed) across all expenses.
- **Settlement view**: run a debt-simplification algorithm (greedy: match largest creditor with largest debtor repeatedly) to produce a minimal list of "who pays whom how much" — don't just show a raw N×N matrix, that's not a real product feel.

### 6.7 Dashboard

- Single page per trip showing: trip status, finalized (or leading) destination/dates, budget summary, upcoming itinerary items, recent expenses, member list with roles, and outstanding settlement summary.
- This is the page members land on after clicking into a trip — it should answer "what's the state of this trip right now" at a glance.

---

## 7. Security Checklist (apply to every new mutation)

- [ ] Session checked (`getServerSession` / Auth.js helper) — reject if absent.
- [ ] Trip membership checked for the specific `tripId` in the request — reject if absent.
- [ ] Role checked if the action is owner-only — reject if insufficient.
- [ ] Input validated with Zod before touching Prisma.
- [ ] Resource ownership checked where relevant (e.g., a member editing an expense must be the original payer, unless owner).
- [ ] No sensitive data (other users' emails, invitation tokens) leaked in API responses beyond what the UI needs.

---

## 8. Engineering Conventions

- **TypeScript strict mode on.** No `any`, no implicit `any`, no non-null assertions (`!`) unless genuinely unavoidable and commented.
- **Server Actions return a discriminated result type**, e.g. `{ success: true, data: T } | { success: false, error: string }`, never throw raw errors to the client.
- **Reusable UI components** in `components/ui/` (Button, Input, Select, Modal, Card, Badge, ProgressBar, Avatar) — build these once, style with Tailwind, and reuse everywhere rather than rewriting markup per feature.
- **Loading and empty states are not optional.** Every list view (destinations, dates, itinerary, expenses) needs a skeleton/loading state and a deliberate empty state (e.g., "No destinations proposed yet — add the first one").
- **Testing**: unit tests for the settlement/debt-simplification algorithm and for split-calculation logic (these have real edge cases — rounding, zero-amount expenses, single-member splits) using Vitest or Jest. Integration/E2E coverage is a stretch goal, not a blocker.
- **Environment variables**: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, OAuth client id/secret, optional email provider keys — document all of these in a `.env.example`.

---

## 9. Build Order (suggested milestones)

1. Project scaffold: Next.js + TS + Tailwind + Prisma + Postgres connection, deployed to Vercel with a working "hello world" route.
2. Auth.js wired up (credentials + Google), database sessions, protected routes via `proxy.ts`. **Done** — see §10.
3. Trip CRUD + membership + invitation flow (no voting/budget/expenses yet). **Done** — see §10.
4. Destination & date voting (the unique-constraint-based voting model). **Done** — see §10.
5. Budget categories + itinerary items (simpler CRUD-with-permissions features). **Done** — see §10.
6. Expense entry + split calculation + balances + settlement algorithm. **Done** — see §10.
7. Dashboard page pulling all of the above together. **Done** — see §10.
8. Polish: empty states, loading states, responsive layout pass, error boundaries. **Done** — see §10.

---

## 10. Decisions Log

These were open questions, now resolved — recorded here so the reasoning isn't lost:

- **Roles**: Owner/Member only, no co-organizer tier at launch.
- **Voting**: Single-choice per poll (one vote per user per destination poll, one vote per user per date poll), enforced via DB unique constraint.
- **Currency**: Single stored currency per trip (`Trip.currency`). No multi-currency expenses, no exchange-rate history. Users can optionally view dashboard amounts converted to a personal preferred display currency — display-only, original amount always remains the source of truth (see 6.4a).
- **Invitations**: Email delivery is stubbed (console.log) for now. Swap in Resend/Postmark later behind the same interface — keep the "send invitation email" call isolated in one function (e.g. `lib/services/email.ts`) so swapping providers later doesn't touch invitation logic.
- **Proxy vs Middleware**: This Next.js version (16.2.9) renamed `middleware.ts` to `proxy.ts` (confirmed via `node_modules/next/dist/docs`). Use `proxy.ts` everywhere this file says "middleware." `npx @next/codemod@canary middleware-to-proxy .` exists if a future dependency reintroduces a stray `middleware.ts`.
- **bcrypt → bcryptjs**: Used `bcryptjs` instead of `bcrypt` for password hashing — same algorithm and API, but pure JS (no native build step), which avoids node-gyp friction in local dev and serverless builds.
- **Invitation tokens**: `crypto.randomBytes(32).toString("hex")` (256-bit, opaque, unguessable) rather than a JWT — there's nothing to verify offline, just a DB lookup by `token`, so a plain random string is simpler and equally secure. Invitations expire 7 days after creation/resend (`expiresAt`); re-inviting the same not-yet-accepted email rotates the existing `TripInvitation` row's token/expiry instead of creating a duplicate row.
- **Invite creation vs. acceptance split**: Per §2's API style guidance, creating an invitation (owner action) is a Route Handler (`POST /api/trips/[tripId]/invite`, matches the suggested folder layout) so the client `InviteMemberForm` can fetch it and show custom status codes (401/403/409-style messages). Accepting an invitation is a Server Action (`app/invite/actions.ts`) since it's a simple same-page mutation with no documented dedicated route — the visitor already lands on `/invite/[token]`, which resolves the trip via the token itself.
- **Non-member trip access**: Visiting `/trips/[tripId]/*` without an ACCEPTED `TripMembership` calls `notFound()` (renders the standard 404) rather than a distinguishable 403 — this avoids confirming a trip ID exists to someone who isn't a member. Enforced in `app/(dashboard)/trips/[tripId]/layout.tsx` and re-checked in every trip Server Action/Route Handler via `lib/auth/permissions.ts`, per §4/§7.
- **Invite accept email matching**: `acceptInvitation` requires the signed-in user's email to exactly match `TripInvitation.email` before creating the membership — not specified explicitly in §6.2, but necessary so a different logged-in user can't consume someone else's invitation link. If they don't match, `/invite/[token]` shows a "wrong account" message with a sign-out option instead of silently failing.
- **Credentials + database sessions**: Auth.js's `CredentialsProvider` cannot use the `database` session strategy (hard library limitation, JWT-only). Implemented a custom session helper (`lib/auth/credentials.ts`) that hashes/verifies passwords and manually creates a `Session` row + the matching `authjs.session-token` cookie, so credentials logins get real, server-revocable database sessions identical in shape to Auth.js's own (Google) sessions. `auth.ts` only registers the `Google` provider; email/password is handled entirely in `app/(auth)/actions.ts` + `lib/auth/credentials.ts`, never through Auth.js's `signIn("credentials", ...)`.
- **`proposedBy`/relation fields stay plain strings**: `DestinationOption.proposedBy` / `DateOption.proposedBy` are plain `String` columns, not relations — matches §5's literal schema (only `ItineraryItem.createdById` is a real relation there). An earlier in-progress draft of `lib/services/voting.ts` had used a `proposedById` relation pattern instead; reconciled back to the documented plain-string contract rather than changing the schema, per explicit direction.
- **Finalize uses option IDs, not freeform dates**: `FinalizeTripSchema`/`finalizeTrip` take `finalDestinationId` + `finalDateOptionId` (both referencing existing, trip-scoped `DestinationOption`/`DateOption` rows) rather than accepting raw `finalStartDate`/`finalEndDate` values directly from the client. §6.3 describes finalize as defaulting to "the current leading options" with the owner able to "override the leading option manually" — read as choosing among proposed options, not entering arbitrary dates. `Trip.finalStartDate`/`finalEndDate` are still populated by copying the chosen `DateOption`'s dates at finalize time, matching §5's plain-`DateTime` field shape.
- **`PLANNING` → `VOTING` transition**: §6.3 describes voting behavior but not what triggers it. Added an owner-only `startVoting` action/button (visible on the trip overview while `status = PLANNING`) that flips `Trip.status` to `VOTING` — without it, proposing/voting would be permanently unreachable since `createTrip` defaults new trips to `PLANNING`.
- **`ItineraryItem.order` field added**: §5's conceptual schema only has `dayIndex` on `ItineraryItem`, but §6.5 requires "drag-and-drop reordering within a day" and literally says "persists new dayIndex/order on drop" — `dayIndex` alone can't express relative order among same-day items. Added `order Int @default(0)`; `dayIndex` controls which day group an item belongs to, `order` controls position within that day. Confirmed with the user before adding (a real schema change, per §1's flag-deviations rule).
- **`dayIndex` is 1-indexed and IS the displayed day number**: no separate "Day N" translation layer — `dayIndex = 1` means "Day 1" directly. Simpler than maintaining a 0-based offset that's always +1'd for display.
- **`BudgetCategory.expenses` deferred to milestone 6**: §5's schema shows `BudgetCategory.expenses Expense[]`, but `Expense` doesn't exist until milestone 6 — a Prisma relation can't reference a model that isn't defined yet. `BudgetCategory` was added without that field now; it'll be added alongside `Expense` itself in milestone 6 (same incremental pattern used for `Trip.finalDestinationId` in milestone 3/4 and the `User` back-relations added per-milestone). Planned-vs-actual tracking (§6.4) is consequently not yet shown on the budget page — it shows planned amounts and a total only, with a note that actuals arrive in milestone 6.
- **Itinerary item edit/delete permissions**: §4 doesn't specify who can edit/delete itinerary items (only that "members can add" them). Modeled after the expense-ownership pattern stated elsewhere in §6.6 ("members can only delete/edit their own") — an item's creator or the trip owner can edit/delete it; other members cannot. Reordering (drag-and-drop) is open to any trip member, since it doesn't change content, only display order.
- **Drag-and-drop without a library**: Implemented with native HTML5 drag-and-drop events (`draggable`, `onDragStart`/`onDragOver`/`onDrop`) rather than adding `dnd-kit`/`react-beautiful-dnd`. Scoped to reordering within a single day's list (matches §6.5's literal "within a day"); moving an item to a different day is done via its Edit form's Day field, not drag-and-drop.
- **Budget actuals via `groupBy`**: `getBudgetActuals` in `lib/services/budget.ts` uses Prisma's `expense.groupBy({ by: ["categoryId"] })` to get sums per category in one query. The special key `"__uncategorized__"` holds expenses with no category. Both the budget page and dashboard consume this without a separate N+1 per-category query.
- **Dashboard data fetched in 2 parallel rounds**: core data (trip, membership, members, budget, itinerary, expenses, settlement) all in `Promise.all`; then a conditional second `Promise.all` for voting options — only for VOTING/FINALIZED trips, since destination/date queries are unnecessary during PLANNING.
- **`loading.tsx` / `error.tsx` placed at `[tripId]` level**: Next.js App Router picks up the closest ancestor's loading/error file. A single `loading.tsx` and `error.tsx` at `app/(dashboard)/trips/[tripId]/` cover the dashboard and all sub-routes (budget, expenses, itinerary, etc.) without requiring a separate file per page. A `loading.tsx` at `app/(dashboard)/trips/` covers the trip list page independently.
- **`DashboardSection` defined inline in page.tsx**: a plain presentational sub-component with no data fetching of its own, so it lives in the same file rather than a separate `components/` file. If it grows (e.g., sticky header, collapsible), extract it then.
- **Budget page now shows planned vs actual**: `BudgetCategoryRow` accepts an `actualAmount: number` prop and renders a progress bar (red when over budget). The budget page fetches `getBudgetActuals` in parallel with `listBudgetCategories` and passes actuals down. The old "expense tracking coming soon" placeholder is removed.
- **Sign-up/sign-in bug fix — `useActionState` actions must go through the `action`/`formAction` prop, not a manual `onSubmit`**: `SignUpForm`/`SignInForm` previously called `event.preventDefault()` in `onSubmit` and invoked the dispatch function returned by `useActionState` directly with `new FormData(event.currentTarget)`. That dispatch function is only safe to call directly from inside `startTransition` (or via a `<form action={...}>`/`formAction` prop, which React wraps in a transition automatically) — called from a bare event handler, React throws "An async function with useActionState was called outside of a transition" and the submit silently no-ops, which is exactly the reported "nothing happens" bug on both forms. Fixed by binding `<form action={action}>` directly (matching the already-working `SignOutButton` pattern) and removing the manual `onSubmit`/`handleSubmit` entirely. Verified via a Playwright-driven browser session (real click, not just curl) since the failure only manifests with actual client JS execution.
- **Forgot password reuses `VerificationToken`, not a new model**: Auth.js's `VerificationToken` (`identifier` + `token` + `expires`, single-use by deletion) already matches a password-reset token's shape exactly, so no schema migration was needed — `identifier` holds the user's email. `lib/auth/credentials.ts` gained `createPasswordResetToken`/`isPasswordResetTokenValid`/`resetPassword`, colocated with the existing password hash/session helpers since this is credentials-flow logic, not a new domain service. Reset tokens expire after 1 hour (shorter than invitations' 7 days, since this guards account takeover rather than a group-planning invite). Resetting a password deletes all of that user's `Session` rows (forces re-login everywhere) and immediately creates a fresh session on success, mirroring sign-up/sign-in's own post-action behavior.
- **Same `onSubmit`/`preventDefault` regression found in 9 more mutation forms**: `ProposeDestinationForm`, `ProposeDateForm`, `CreateItineraryItemForm`, `ItineraryItemCard`'s edit form, `AddExpenseForm`, `ExpenseRow`'s edit form, `CreateBudgetCategoryForm`, `BudgetCategoryRow`'s edit form, `FinalizeTripPanel`, `CreateTripForm`, and `UpdateTripForm` all had the identical bug described above (manually calling the `useActionState` dispatch function from a bare `onSubmit` instead of `<form action={action}>`), which is why "adding a destination doesn't appear" and similarly silent no-ops were reported across several features at once — it was one systemic regression, not independent bugs. All fixed the same way: bind `action` directly to the form's `action` prop and delete the `handleSubmit`/`FormEvent` wrapper.
- **Emails are lowercased at the validation layer, everywhere**: `SignUpSchema`, `SignInSchema`, `ForgotPasswordSchema`, and `InviteMemberSchema` all chain `.toLowerCase()` after `.trim()` on their email field (matching the existing `.toUpperCase()` normalization already used for `Trip.currency`). Root cause: invitations are matched by exact-string email (`lib/services/invitations.ts#listPendingInvitationsForUser`), so if an owner typed a friend's email with different casing than the friend later signs up with, the invite would silently never appear on that account's `/invites` page — no error, just zero rows. Normalizing case on write closes that gap going forward; it does not retroactively fix rows already stored with mixed case.
- **Known issue, not fixed**: Prisma's default query engine (`lib/db.ts`'s bare `new PrismaClient()`, no driver adapter) intermittently fails to reach the Neon database in local dev with `Can't reach database server`, even though a plain `pg` client connects to the exact same `DATABASE_URL`/`DIRECT_URL` reliably every time — confirmed by direct comparison during this debugging session. When it fires mid-request, Auth.js's session lookup treats the connection error as an invalid session and calls the adapter's `deleteSession`, signing the user out. The obvious fix is wiring up `@prisma/adapter-pg` (already a dependency) in `lib/db.ts`, but it's currently pinned to `^7.8.0` while `@prisma/client`/`prisma` are on `^6.19.3` — a real version mismatch that needs resolving (align both to the same major) before the adapter can be wired up safely. Left alone pending user direction since it's a dependency-version change, not a one-line fix.

