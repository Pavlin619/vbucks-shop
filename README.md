# VBucks Shop

E-commerce app where users buy V-Bucks with real money (Stripe) and spend them on
Fortnite skins. Skin delivery is manual — an admin gifts the skin in-game via
Fortnite after receiving an email notification.

**Stack**: Next.js 16 (App Router) · TypeScript · Tailwind CSS · Clerk · Supabase · Stripe · Resend · Vercel

---

## Prerequisites

- Node.js 20+
- npm 10+
- [Supabase CLI](https://supabase.com/docs/guides/cli) — for local DB
- [Stripe CLI](https://stripe.com/docs/stripe-cli) — for local webhook forwarding

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in all values. See `.env.example` for descriptions of each variable.

### 3. Start the database

```bash
supabase start        # starts local Postgres + Studio
supabase db push      # applies migrations in supabase/migrations/
```

### 4. Forward Stripe webhooks

In a separate terminal (keep this running while testing payments):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the printed `whsec_...` value into `STRIPE_WEBHOOK_SECRET` in `.env.local`.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note**: `npm run dev` is the correct command for local development.
> `npm run start` runs the **production** server and requires a prior `npm run build` —
> do not use it for day-to-day development.

---

## Testing

### Unit tests (Vitest)

```bash
npm run test        # watch mode
npm run test:run    # single run (CI)
```

Unit tests live in `__tests__/unit/`. They mock all external dependencies (Supabase,
Stripe, Resend, Clerk).

### E2E tests (Playwright)

```bash
npm run test:e2e       # headless
npm run test:e2e:ui    # with browser UI
```

E2E tests live in `__tests__/e2e/`. They run against a real test Supabase project —
make sure your `.env.local` points to a test (not production) Supabase project before
running E2E tests.

---

## Scripts reference

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server (requires `build` first) |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests in watch mode |
| `npm run test:run` | Run unit tests once (CI) |
| `npm run test:e2e` | Run E2E tests headless |
| `npm run test:e2e:ui` | Run E2E tests with browser UI |

---

## Project structure

```
app/                  Next.js App Router (routes + layouts)
components/           Reusable UI components (no business logic)
lib/                  SDK clients (Supabase, Stripe, Resend) and constants
services/             Business logic (wallet, orders, skins, email)
types/                Shared TypeScript types (types/index.ts)
supabase/migrations/  Database schema migrations
__tests__/unit/       Vitest unit tests
__tests__/e2e/        Playwright E2E tests
docs/                 Domain-specific rules (read before touching a domain)
specs/                Feature specifications and implementation plans
```

Key rules — see `AGENTS.md` for the full list:
- Business logic lives in `services/` only, never in components
- `lib/supabase/admin.ts` (service role key) is imported only in `app/api/**`
- Every API route: authenticate first, validate input second, then logic
- All money amounts are in cents (integers), never floats

---

## Domain docs

Read the relevant doc before modifying that area:

| Doc | Covers |
|-----|--------|
| `docs/DATABASE.md` | Schema, query rules, migration conventions |
| `docs/AUTH.md` | Clerk setup, route protection, admin access |
| `docs/PAYMENTS.md` | Stripe flow, webhook handling, idempotency |
| `docs/TESTING.md` | What to test, test structure, `data-testid` conventions |

---

## Admin access

Admin routes (`/admin`, `/api/admin/*`) are protected by the `ADMIN_USER_IDS`
environment variable — a comma-separated list of Clerk user IDs. Add your Clerk
user ID there to access the admin dashboard locally.

---

## Deployment

Deploy to Vercel by connecting the repository. Set all environment variables from
`.env.example` in the Vercel project settings. Stripe webhook endpoint:
`https://your-domain.vercel.app/api/webhooks/stripe`.
