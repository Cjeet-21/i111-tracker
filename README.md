# i111 Tracker

> Track your coding-problem practice with the **i111** spaced-repetition schedule —
> solve a problem once, then revise it on **Day 0 → Day 1 → Day 7 → Day 30**, and it stays yours.

**Live app → https://i111-tracker.vercel.app**

[![Live](https://img.shields.io/badge/live-i111--tracker.vercel.app-4f46e5?style=for-the-badge)](https://i111-tracker.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql)](https://neon.tech)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

---

## The problem

Solving a problem is the easy half. The solution quietly evaporates within a
week, and a week later you are solving it from scratch again. Almost nobody
schedules the revisits — so this app does it for you.

Every problem you add gets a four-step revision plan. The app tells you what to
revise today, what you missed, and when each problem comes back around.

## The i111 schedule

| # | Stage | Due | Why this gap |
|---|-------|-----|--------------|
| 1 | **Immediate** | same day | Sharpen the details you rushed past the first time |
| 2 | **1 Day** | +1 day | Re-solve from scratch before the memory is comfortable |
| 3 | **1 Week** | +7 days | Where most solutions quietly die |
| 4 | **1 Month** | +30 days | The real test — if you can still do it cold, it is yours |

The schedule is **data, not code**: `lib/scheduling/intervals.ts` holds the
intervals, and `lib/scheduling/engine.ts` is a pure, unit-tested function that
turns them into dates. Swapping in a custom schedule means editing one array.

## Features

- **Today's queue** — one list with exactly what is due, nothing else.
- **Honest overdue handling** — miss a day and the problem stays, tagged with how
  many days late you are. A late revision schedules the next stage from the date
  you *actually* did it, never back-dated.
- **Revision history** — every attempt is logged with its scheduled date, actual
  date, and on-time / late status.
- **Problem library** — search by title, topic or difficulty.
- **Calendar** — see the month ahead and spot days where too many revisions land.
- **Statistics** — completion rate, on-time ratio, per-topic breakdown.
- **Your timezone** — plain calendar dates, so a revision never shifts a day
  because you are in IST and the server is in UTC.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Database | PostgreSQL (Neon in production, embedded Postgres locally) + Prisma 6 |
| Validation | Zod (same schemas for client forms and server actions) |
| Auth | Hand-rolled: `scrypt` password hashing + DB-backed sessions |
| Tests | Vitest (unit) + an HTTP smoke test that drives the real forms |

## Getting started

**Requirements:** Node.js 20+ and npm.

```bash
git clone https://github.com/Cjeet-21/i111-tracker.git
cd i111-tracker
npm install
```

### 1. Database

Either use the embedded PostgreSQL (nothing to install):

```bash
npm run db:local      # PostgreSQL 18 on :55432, user/pass postgres/postgres, db i111
npm run db:migrate    # create the tables
```

…or point at any managed Postgres (Neon, Supabase, Railway):

```bash
npm i -g neon@latest && neon login
neon init -y --agent opencode --org-id <org-id> --project-id <project-id>
node scripts/wire-neon-env.mjs   # writes DATABASE_URL / DIRECT_URL into .env
npm run db:deploy
```

### 2. Environment

```bash
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled connection string used by the app at runtime |
| `DIRECT_URL` | Direct connection string used by `prisma migrate` |
| `AUTH_SECRET` | Signs the session cookie — `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `NEXT_PUBLIC_APP_URL` | Canonical URL of the app |

### 3. Run it

```bash
npm run dev        # http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `npm run start` | Production build / serve it |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | HTTP smoke test against a running server |
| `npm run db:local` | Embedded PostgreSQL for offline dev |
| `npm run db:migrate` / `db:deploy` | Apply migrations (dev / prod) |
| `npm run db:studio` | Browse the database in the browser |

## Deployment

The app runs on **Vercel** (Next.js) with **Neon** Postgres in Singapore.

```bash
vercel link --project i111-tracker --yes
vercel env add DATABASE_URL production --value "..." --sensitive --yes
vercel env add DIRECT_URL   production --value "..." --sensitive --yes
vercel env add AUTH_SECRET  production --value "..." --sensitive --yes
vercel deploy --prod
```

`vercel.json` pins the build command (`npx prisma migrate deploy && next build`)
and the function region (`sin1`, next to the database), so migrations run on
every deploy and the app never talks to Postgres across an ocean.

## Testing

- **Unit (34 tests)** — the scheduling engine (initial schedule, stage
  advancement, overdue maths, completion, custom intervals), the timezone/date
  helpers, and password hashing.
- **End-to-end (31 checks)** — `npm run test:e2e` starts no server of its own;
  point it at a running app:

  ```bash
  npm run build && npm run start        # terminal 1
  npm run test:e2e                      # terminal 2
  BASE_URL=https://i111-tracker.vercel.app npm run test:e2e
  ```

  It drives the real progressive-enhancement form endpoints and asserts the
  whole product: signup, login, route protection, problem creation, stage
  advancement with the right dates, revision history, closed-cycle behaviour,
  cross-user isolation, the unique constraint on `(problem, cycle, stage)`, and
  overdue handling. It deletes its own test users afterwards.

## Project structure

```
app/                  Pages (App Router)
  page.tsx            Public landing page
  (auth)/             login, signup
  (app)/              dashboard, revisions, problems, calendar, statistics, settings
components/           UI, forms, shell, landing page, i111 progress
lib/
  actions/            Server actions (auth, problems, revisions, settings)
  auth/               scrypt hashing, session create/verify/prune
  queries/            User-scoped data access (server-only)
  scheduling/         Intervals + pure engine
  dates.ts            Timezone and plain-date helpers
prisma/               Schema + migrations
scripts/              dev-db, e2e-smoke, neon env wiring
tests/                Vitest unit tests
```

## Design notes

Things worth knowing if you are reading the code or asking about it:

- **Auth is first-party.** Passwords are hashed with `scrypt` and a per-user
  salt. Sessions are opaque random tokens stored *hashed* in Postgres and
  delivered in an `httpOnly`, `Secure`, `sameSite=lax` cookie, so a database
  leak cannot be replayed as a login. No third-party auth dependency.
- **Every query is user-scoped.** Data access lives in `lib/queries/*` and always
  filters by the session's `userId`; the e2e suite asserts that one user cannot
  read or mutate another user's problems.
- **Dates are plain calendar dates.** They are stored as UTC-midnight `Date`s and
  the user's IANA timezone is only used to compute "today" and query ranges, so
  a revision never lands a day early or late.
- **Integrity is enforced in the database, not just in the UI.** Check
  constraints keep `currentStage` in range and `cycle >= 1`, and a unique
  constraint on `(problemId, cycle, stage)` makes a double-clicked revision
  impossible rather than merely unlikely.
- **The scheduling engine is pure.** `lib/scheduling/engine.ts` has no I/O and
  no clock of its own — the completion date is always passed in — which is why
  it is cheap to test exhaustively.

## License

MIT
