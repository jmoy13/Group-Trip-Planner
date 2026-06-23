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
- **Session strategy**: Database sessions (not pure JWT) via the Auth.js Prisma adapter, so sessions can be revoked server-side and role lookups stay fresh.

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
          [tripId]/
            page.tsx                // trip dashboard
            destinations/
            dates/
            budget/
            itinerary/
            expenses/
            members/
            settings/
      api/
        auth/[...nextauth]/route.ts
        trips/[tripId]/invite/route.ts
        webhooks/...
    lib/
      auth/
        permissions.ts             // role + membership checks
        session.ts                 // getServerSession wrapper
      validation/                  // zod schemas
      services/                    // business logic per domain (trips, voting, expenses, itinerary)
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

- Auth.js with the Prisma adapter, database sessions.
- Support email/password (with hashed passwords, e.g. via `bcrypt`) AND at least one OAuth provider (Google) — credentials alone is a weak default for a "real product" feel.
- Protect all `(dashboard)` routes via middleware (`middleware.ts`) checking for a valid session; redirect unauthenticated users to `/sign-in` with a `callbackUrl`.

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
2. Auth.js wired up (credentials + Google), database sessions, protected route middleware.
3. Trip CRUD + membership + invitation flow (no voting/budget/expenses yet).
4. Destination & date voting (the unique-constraint-based voting model).
5. Budget categories + itinerary items (simpler CRUD-with-permissions features).
6. Expense entry + split calculation + balances + settlement algorithm.
7. Dashboard page pulling all of the above together.
8. Polish: empty states, loading states, responsive layout pass, error boundaries.

---

## 10. Decisions Log

These were open questions, now resolved — recorded here so the reasoning isn't lost:

- **Roles**: Owner/Member only, no co-organizer tier at launch.
- **Voting**: Single-choice per poll (one vote per user per destination poll, one vote per user per date poll), enforced via DB unique constraint.
- **Currency**: Single stored currency per trip (`Trip.currency`). No multi-currency expenses, no exchange-rate history. Users can optionally view dashboard amounts converted to a personal preferred display currency — display-only, original amount always remains the source of truth (see 6.4a).
- **Invitations**: Email delivery is stubbed (console.log) for now. Swap in Resend/Postmark later behind the same interface — keep the "send invitation email" call isolated in one function (e.g. `lib/services/email.ts`) so swapping providers later doesn't touch invitation logic.

