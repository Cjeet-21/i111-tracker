# i111 Tracker

A mobile-first web app for tracking coding-problem practice with the **i111 spaced-repetition
revision schedule**: after solving a problem you revise it at **Immediate → +1 Day → +7 Days →
+30 Days**, then the problem is **Completed**. Overdue revisions stay visible until you close them,
and every revision records when it was actually done.

## Stack

| Layer      | Choice                                                             |
| ---------- | ------------------------------------------------------------------ |
| Framework  | Next.js 16 (App Router, Server Actions, Turbopack), React 19, TypeScript |
| Styling    | Tailwind CSS v4                                                    |
| Database   | PostgreSQL + Prisma 6 (two migrations)                             |
| Auth       | First-party sessions: scrypt password hashing + DB-backed sessions, HMAC-signed httpOnly cookie (`i111_session`, 30-day expiry) |
| Validation | Zod schemas shared by forms and actions                            |
| Tests      | Vitest (scheduling engine, dates, password) + HTTP e2e smoke test  |

Auth is deliberately hand-rolled instead of a managed provider (NextAuth/Clerk): no third-party
dependency, sessions are revocable rows in the database, and password hashing uses Node's built-in
`crypto.scrypt`. The trade-off (no OAuth, no password reset emails) fits a single-user-per-account
practice tracker.

## Local development

**Requirements:** Node.js 20+ (tested on v24).

```bash
npm install            # also runs: prisma generate
cp .env.example .env   # then fill in the values (see below)
npm run db:local       # starts an embedded PostgreSQL 18 on port 55432 (data in ./.local-db)
npm run db:migrate     # applies prisma/migrations (first run: db:migrate --name init)
npm run dev            # http://localhost:3000
```

`npm run db:local` runs `scripts/dev-db.mjs`, which boots an embedded PostgreSQL server with
`user/password = postgres/postgres`, database `i111`. It prints a ready `DATABASE_URL` you can
paste into `.env`. Stop it with Ctrl+C; data persists in `.local-db/` (git-ignored).

Prefer your own PostgreSQL? Point `DATABASE_URL` at Neon/Supabase/local Docker and skip
`db:local`.

### Environment variables (`.env`)

| Variable             | Purpose                                                       |
| -------------------- | ------------------------------------------------------------- |
| `DATABASE_URL`       | Prisma connection string (`?schema=public`)                   |
| `DIRECT_URL`         | Non-pooler connection used by `prisma migrate` (Neon: the `-ep` URL) |
| `AUTH_SECRET`        | Signs session cookies — generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `NEXT_PUBLIC_APP_URL`| Canonical URL of the app (defaults to `http://localhost:3000`) |

`.env` is git-ignored; `.env.example` documents every variable.

## Scripts

| Command              | What it does                                            |
| -------------------- | ------------------------------------------------------- |
| `npm run dev`        | Dev server (Turbopack)                                  |
| `npm run build`      | Production build                                        |
| `npm run start`      | Serve the production build                              |
| `npm run lint`       | ESLint                                                  |
| `npm run typecheck`  | `tsc --noEmit`                                          |
| `npm test`           | Unit tests (Vitest)                                     |
| `npm run test:e2e`   | HTTP smoke test against a **running** server (see below) |
| `npm run db:local`   | Embedded PostgreSQL for local development               |
| `npm run db:migrate` | Create/apply migrations (dev)                           |
| `npm run db:deploy`  | Apply migrations (production)                           |
| `npm run db:studio`  | Prisma Studio                                           |

## Testing

- **Unit:** `npm test` — 34 tests covering the scheduling engine (initial schedule, stage
  advancement, overdue math, completion, custom interval configs), timezone/date helpers, and
  password hashing/verification.
- **End-to-end:** with the production server running (`npm run build && npm run start`), run
  `npm run test:e2e`. It drives the real forms over HTTP (progressive-enhancement server-action
  posts) and asserts 29 checks: route protection, signup/login, cross-user data isolation (404 on
  another user's problem), problem creation, i111 stage advancement with correct `today + 1 day`
  dates, revision history, closed-cycle behavior, the `(problemId, cycle, stage)` unique
  constraint, overdue queue badges, and scheduling the next stage from the actual (late)
  completion date. Point it at a deployed URL with
  `BASE_URL=https://your-app.vercel.app npm run test:e2e`.

## How the i111 schedule works

- Scheduling is data-driven: `lib/scheduling/intervals.ts` exports
  `I111_INTERVALS = [{ stage, name, days }, ...]` (`Immediate/0`, `1 Day/1`, `7 Days/7`,
  `30 Days/30`). `lib/scheduling/engine.ts` is pure and unit-tested; adding a custom schedule
  means swapping that array.
- `Problem` rows store `currentStage`, `nextRevisionDate`, `cycle`, and `status`
  (`ACTIVE` → `COMPLETED`). Each completed stage writes a `RevisionHistory` row with
  `scheduledDate`, `completedAt`, `daysLate`, and `status` (`ON_TIME` / `LATE` /
  `EARLY`), enforced unique per `(problemId, cycle, stage)` so double-clicks can never
  duplicate a revision.
- Plain calendar dates are stored as UTC-midnight `Date`s; the user's IANA timezone (profile
  setting) is only used to compute "today" and query ranges (`lib/dates.ts`), so dates don't
  drift a day around midnight.
- Overdue = `nextRevisionDate < today`. Overdue problems keep appearing in **Revisions** with an
  "N days overdue" badge until marked revised. A late revision advances to the next stage with
  `nextRevisionDate = actual completion date + interval` (never back-dated).
- Revising a problem whose cycle is closed returns an error; the UI hides the button once
  `status = COMPLETED`.

## Project structure

```
app/                  Pages (App Router)
  (auth)/             login, signup
  (app)/              dashboard, revisions, problems (+ new/[id]/edit), calendar, statistics, settings
components/           UI, forms, shell/navigation, i111 progress
lib/
  actions/            Server actions (auth, problems, revisions, settings)
  auth/               scrypt hashing, session create/verify/prune
  queries/            User-scoped data access (server-only)
  scheduling/         Intervals + pure engine
  dates.ts            Timezone/plain-date helpers
  validation.ts       Zod schemas + error formatting
prisma/               schema.prisma + migrations
scripts/              dev-db.mjs (embedded Postgres), e2e-smoke.mjs
tests/                Vitest unit tests
proxy.ts              Route guard: cookie-presence redirect (authoritative check in (app)/layout)
```

Every query and mutation is scoped by `userId` from the session; forms re-validate with Zod
inside the action (never trusting client input).

## Deployment (GitHub → Vercel + Neon)

1. **Push to GitHub**

   ```bash
   git init
   git add . && git commit -m "i111 tracker"
   git remote add origin https://github.com/<you>/i111-tracker.git
   git push -u origin main
   ```

2. **Create a Postgres database** — [Neon](https://neon.tech) (free tier), Supabase, or Railway.
   Copy the pooled URL (`DATABASE_URL`) and the direct endpoint URL (`DIRECT_URL`).

3. **Import the repo into Vercel** — *Add New → Project → Import Git Repository*.
   Framework preset: **Next.js** (auto-detected). Build command/output are left at defaults.

4. **Set environment variables in Vercel** (Project → Settings → Environment Variables, Production
   + Preview + Development):

   | Name                 | Value                                   |
   | -------------------- | --------------------------------------- |
   | `DATABASE_URL`       | Neon pooled connection string            |
   | `DIRECT_URL`         | Neon direct (`-ep`) connection string    |
   | `AUTH_SECRET`        | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
   | `NEXT_PUBLIC_APP_URL`| `https://<your-app>.vercel.app`          |

5. **Apply migrations on deploy** — add a Vercel build step (or run once locally):

   ```bash
   # Vercel → Settings → Build & Development Commands → Build Command:
   npx prisma migrate deploy && next build
   ```

   Locally: `DATABASE_URL=... npm run db:deploy`.

6. **Deploy** — push to `main`; Vercel builds and serves the app. First visit: **Sign up**.

Notes:

- The session cookie is `httpOnly` + `Secure` (auto in production) + `sameSite=lax`; Prisma's
  `queryTimeout`/pooler settings need no change on Neon serverless.
- Prisma Client is generated at build time (`postinstall`), so Vercel needs no extra config.
- Run the e2e suite against the preview deployment:
  `BASE_URL=https://i111-tracker-<hash>-<you>.vercel.app npm run test:e2e`.

## Checks before shipping

```bash
npm run lint && npm run typecheck && npm test && npm run build
npm run start   # then, in another terminal: npm run test:e2e
```
