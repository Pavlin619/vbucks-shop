# Database

Supabase (Postgres). Schema changes via migration files in `supabase/migrations/` only — never via the dashboard UI.

## Tables

**profiles** — one row per user, keyed on Clerk userId
- `id` text PK — equals the Clerk userId verbatim (e.g. `user_2abc...`); we don't use Supabase auth
- `fortnite_username` text nullable — required before user can buy a skin
- `vbucks_balance` integer default 0 — check constraint: must be >= 0

**purchases** — immutable ledger of real-money transactions, never update/delete
- `user_id` text — FK to `profiles.id`
- `stripe_session_id` text unique — idempotency key, prevents double-crediting on webhook replay
- `vbucks_amount` integer — credited V-Bucks
- `amount_cents` integer — what Stripe charged

**skin_orders** — one row per skin purchase
- `user_id` text — FK to `profiles.id`
- `status` enum-like text: `pending` | `gifted` | `refunded` — enforced with check constraint
- Admin sets `gifted` manually via admin panel

## Functions

- `increment_vbucks(p_user_id text, p_amount integer)` — atomic balance credit; raises if profile missing.
- `buy_skin(p_user_id text, p_skin_id text, p_skin_name text, p_vbucks_cost integer) RETURNS uuid` — atomic balance debit + skin_orders insert; relies on the `vbucks_balance >= 0` CHECK to surface insufficient-balance races as SQLSTATE `23514`.
- `credit_purchase(p_user_id text, p_session_id text, p_vbucks integer, p_amount_cents integer) RETURNS text` — atomic purchases insert (idempotent via `ON CONFLICT (stripe_session_id) DO NOTHING`) + balance credit; returns `'credited'` or `'duplicate'`. **Use this from the Stripe webhook**, not a separate INSERT-then-RPC pair.

All functions are `SET search_path = ''` and use fully-qualified table names to defend against search-path-shadowing attacks.

## Rules
- `lib/supabase/admin.ts` (service role key) — used in API routes and services for all reads and writes; bypasses RLS. Never import from a client component (enforced via `import 'server-only'`).
- RLS is enabled on every table with `USING (false)` policies + `REVOKE ALL ON ... FROM anon, authenticated` (belt + braces). The anon and authenticated roles are never used by this app for direct DB queries.
- Profiles are upserted on first read by [`getProfile`](../services/wallet.ts) (`INSERT ... ON CONFLICT (id) DO NOTHING`), so server pages can call `getProfile(userId)` on first visit without a separate sync round-trip.
- Migration filenames: `YYYYMMDDhhmmss_description.sql`, must be idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`).
- Store money amounts in cents (integer), never floats.
