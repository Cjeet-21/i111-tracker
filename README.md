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
| Database   | PostgreSQL + Prisma 6 — Neon (Singapore) in production, embedded PostgreSQL locally |
| Auth       | First-party sessions: scrypt password hashing + DB-backed sessions, HMAC-signed httpOnly cookie (`i111_session`, 30-day expiry) |
| Validation | Zod schemas shared by forms and actions                            |
| Tests      | Vitest (scheduling engine, dates, password) + HTTP e2e smoke test  |

Auth is deliberately hand-rolled instead of a managed provider (NextAuth/Clerk): no third-party
dependency, sessions are revocable rows in the database, and password hashing uses Node's built-in
`crypto.scrypt`. The trade-off (no OAuth, no password reset emails) fits a single-user-per-account
practice tracker.

## Local development

**Requirements:** Node.js 20+ (tested on v24).

### Option A — Neon (recommended; same database as production)

```bash
npm install            # also runs: prisma generate
npm i -g neon@latest   # once
neon login             # sign in via browser
neon init -y --agent opencode --org-id <org-id> --project-id <project-id>
node scripts/wire-neon-env.mjs   # writes DATABASE_URL / DIRECT_URL / AUTH_SECRET into .env
npm run db:deploy      # apply migrations to Neon
npm run dev            # http://localhost:3000
```

`scripts/wire-neon-env.mjs` builds `.env` from the Neon CLI so it never has to be typed by hand:

- `DATABASE_URL` → **pooled** endpoint (`...-pooler.<region>.aws.neon.tech`) with
  `?sslmode=require&pgbouncer=true&connection_limit=1` (PgBouncer-safe for Prisma)
- `DIRECT_URL` → **direct** endpoint, used by `prisma migrate` / `prisma studio`
- `AUTH_SECRET` / `NEXT_PUBLIC_APP_URL` → preserved from the previous `.env`

Re-run it any time to refresh the strings (e.g. after a Neon password change).

### Option B — embedded PostgreSQL (offline / no cloud account)

```bash
npm install
cp .env.example .env   # fill in the values
npm run db:local       # starts an embedded PostgreSQL 18 on port 55432 (data in ./.local-db)
npm run db:migrate     # applies prisma/migrations
npm run dev
```

`npm run db:local` runs `scripts/dev-db.mjs`, which boots an embedded PostgreSQL server with
`user/password = postgres/postgres`, database `i111`. It prints a ready `DATABASE_URL` you can
paste into `.env`. Stop it with Ctrl+C; data persists in `.local-db/` (git-ignored).

Prefer your own PostgreSQL? Point `DATABASE_URL` at Supabase/local Docker and skip `db:local`.

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
| `npm run db:local`   | Embedded PostgreSQL for offline local development  |
| `npm run db:migrate` | Create/apply migrations (dev)                           |
| `npm run db:deploy`  | Apply migrations (production)                           |
| `npm run db:studio`  | Prisma Studio                                           |
| `node scripts/wire-neon-env.mjs` | Rebuild `.env` from the Neon CLI            |
| `node scripts/cleanup-test-data.mjs` | Delete leftover smoke-test users         |

## Testing

- **Unit:** `npm test` — 34 tests covering the scheduling engine (initial schedule, stage
  advancement, overdue math, completion, custom interval configs), timezone/date helpers, and
  password hashing/verification.
- **End-to-end:** with the production server running (`npm run build && npm run start`), run
  `npm run test:e2e`. It drives the real forms over HTTP (progressive-enhancement server-action
  posts) and asserts 30 checks: route protection, signup/login, cross-user data isolation (404 on
  another user's problem), problem creation, i111 stage advancement with correct `today + 1 day`
  dates, revision history, closed-cycle behavior, the `(problemId, cycle, stage)` unique
  constraint, overdue queue badges, scheduling the next stage from the actual (late) completion
  date — and it deletes its throwaway users afterwards, so the database is left clean. Point it at
  a deployed URL with `BASE_URL=https://your-app.vercel.app npm run test:e2e`.

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
scripts/              dev-db.mjs (embedded Postgres), e2e-smoke.mjs,
                      wire-neon-env.mjs (build .env from the Neon CLI),
                      cleanup-test-data.mjs (remove leftover smoke-test users)
tests/                Vitest unit tests
proxy.ts              Route guard: cookie-presence redirect (authoritative check in (app)/layout)
neon.ts               Neon CLI config (branch policy for the linked project)
```

Every query and mutation is scoped by `userId` from the session; forms re-validate with Zod
inside the action (never trusting client input).

## Deployment (GitHub → Vercel + Neon)

1. **Push to GitHub**

   ```bash
   git init -b main
   git add . && git commit -m "i111 tracker"
   git remote add origin https://github.com/<you>/i111-tracker.git
   git push -u origin main
   ```

2. **Create a Postgres database** — [Neon](https://neon.tech) free tier. Pick a region close to
   your users (this project uses **AWS Asia Pacific 1 — Singapore**). Then either copy the strings
   by hand from *Connect → Connection strings*, or let the CLI do it:

   ```bash
   npm i -g neon@latest && neon login
   neon init -y --agent opencode --org-id <org-id> --project-id <project-id>
   node scripts/wire-neon-env.mjs   # writes both strings into .env
   ```

   The script produces exactly what Prisma needs:

   | Variable      | Endpoint                                    |
   | ------------- | ------------------------------------------- |
   | `DATABASE_URL` | pooled (`-pooler.…`) + `pgbouncer=true&connection_limit=1` |
   | `DIRECT_URL`   | direct (no `-pooler`), used by `prisma migrate` |

3. **Import the repo into Vercel** — *Add New → Project → Import Git Repository*.
   Framework preset: **Next.js** (auto-detected). Build command/output are left at defaults.
   Optionally set **Settings → Functions → Region** to the same region as your database
   (Singapore) so the app and the DB sit next to each other.

4. **Set environment variables in Vercel** (Project → Settings → Environment Variables, Production
   + Preview + Development). Copy the values straight out of your local `.env` (open it in
   Notepad — it is git-ignored):

   | Name                 | Value                                                    |
   | -------------------- | -------------------------------------------------------- |
   | `DATABASE_URL`       | the `DATABASE_URL=` line from your local `.env` (pooled)  |
   | `DIRECT_URL`         | the `DIRECT_URL=` line from your local `.env` (direct)    |
   | `AUTH_SECRET`        | the `AUTH_SECRET=` line from your local `.env`           |
   | `NEXT_PUBLIC_APP_URL`| `https://<your-app>.vercel.app`                           |

5. **Apply migrations on deploy** — add a Vercel build step (or run once locally):

   ```bash
   # Vercel → Settings → General → Build Command:
   npx prisma migrate deploy && next build
   ```

   Locally: `npm run db:deploy` (uses `DIRECT_URL`).

6. **Deploy** — push to `main`; Vercel builds and serves the app. First visit: **Sign up**.

Notes:

- The session cookie is `httpOnly` + `Secure` (auto in production) + `sameSite=lax`.
- Prisma Client is generated at build time (`postinstall`), so Vercel needs no extra config.
- Neon scales the database to zero when idle and wakes it on the next connection, so the first
  request after a pause can take a few extra seconds.
- Run the e2e suite against the preview deployment:
  `BASE_URL=https://i111-tracker-<hash>-<you>.vercel.app npm run test:e2e` (it cleans up after
  itself, so the production database stays empty).

## Checks before shipping

```bash
npm run lint && npm run typecheck && npm test && npm run build
npm run start   # then, in another terminal: npm run test:e2e
```

## Security notes

- Next.js is pinned to the latest patched **16.4.x** release (16.4.6 fixes several published
  advisories affecting App Router / Server Components). Run `npm audit` before every deploy and
  bump the pin when a new patch lands.
- `npm audit` also reports `deepmerge-ts` via `@prisma/config`. That code path is the **Prisma
  CLI** (build/migrate time), not the Prisma Client used at runtime; the upstream fix requires
  Prisma 7 (a major upgrade), so it is tracked rather than force-applied.
- Passwords are hashed with `scrypt` and a per-user salt; sessions are opaque random tokens
  stored hashed in Postgres, so a database leak cannot be replayed as a login.
- Every query and server action is scoped to the session's `userId`; the e2e suite asserts that
  one user cannot read or mutate another user's problems.
