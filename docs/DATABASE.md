# Database

Supabase (Postgres). Schema changes via migration files in `supabase/migrations/` only — never via the dashboard UI.

## Tables

**profiles** — one row per user, keyed on Clerk userId (uuid)
- `id` uuid PK — matches Clerk userId exactly, not Supabase auth
- `fortnite_username` text nullable — required before user can buy a skin
- `vbucks_balance` integer default 0 — check constraint: must be >= 0

**purchases** — immutable ledger of real-money transactions, never update/delete
- `stripe_session_id` text unique — idempotency key, prevents double-crediting on webhook replay

**skin_orders** — one row per skin purchase
- `status` enum-like text: `pending` | `gifted` | `refunded` — enforced with check constraint
- Admin sets `gifted` manually via admin panel

## Rules
- `supabase` (anon key) — used in server components for reads, respects RLS
- `supabaseAdmin` (service role key) — used in API routes for writes, bypasses RLS, never import in components
- RLS enabled on all tables — users can only read their own rows, no client-side writes
- All writes to `purchases` and `skin_orders` go through API routes using the service role key
- Migration filenames: `YYYYMMDD_description.sql`, must be idempotent (use `if not exists`)
- Store money amounts in cents (integer), never floats