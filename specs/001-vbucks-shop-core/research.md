# Research: VBucks Shop Core System

**Feature**: 001-vbucks-shop-core
**Phase**: 0 — Pre-design research
**Date**: 2026-04-17

---

## Decision 1: Payment Flow — Stripe Checkout vs Payment Intents

**Decision**: Use Stripe Checkout (hosted page).

**Rationale**: The `docs/PAYMENTS.md` mandates this. Stripe hosts the card form,
eliminating all PCI DSS scope for the application. The `checkout.session.completed`
webhook drives balance crediting — not the browser redirect — which is the correct
server-authoritative pattern.

**Alternatives considered**:
- Stripe Payment Intents with custom card form: more UI control but requires PCI SAQ A-EP,
  higher complexity, and no meaningful benefit for this use case.

---

## Decision 2: Wallet Storage — Separate Table vs Field on `profiles`

**Decision**: `vbucks_balance` lives as an integer column on the `profiles` table.

**Rationale**: `docs/DATABASE.md` defines this explicitly. A separate `wallets` table
would add a join on every balance read with no additional isolation benefit given RLS
already scopes reads per user.

**Implementation detail**: Balance mutations use a Postgres function
`increment_vbucks(user_id uuid, amount integer)` which is atomic and enforces the
`>= 0` constraint, preventing race conditions on concurrent writes.

**Alternatives considered**:
- Separate `wallets` table: cleaner separation but over-engineered for a single-balance
  system.
- Application-level read-modify-write: subject to TOCTOU race conditions; rejected.

---

## Decision 3: Idempotency for Stripe Webhooks

**Decision**: Use `stripe_session_id` as a unique key in the `purchases` table.
Before crediting, attempt an INSERT. If a unique constraint violation occurs, the
webhook is a duplicate — skip the credit and return HTTP 200 to Stripe.

**Rationale**: Stripe guarantees at-least-once delivery and will replay failed
webhooks. Idempotency via unique key is the standard pattern; `docs/PAYMENTS.md`
mandates it explicitly.

**Alternatives considered**:
- Redis-based deduplication: unnecessary infrastructure for this scale.
- Webhook event table with event IDs: more generic but overkill given the purchases
  table already captures the session ID.

---

## Decision 4: Admin Role Check

**Decision**: Admin access is gated by `ADMIN_USER_IDS` environment variable — a
comma-separated list of Clerk user IDs. Checked server-side on every admin API route
and server component.

**Rationale**: `docs/AUTH.md` defines this pattern. No in-app role management UI
needed for v1. Simple, auditable, zero database writes required.

**Alternatives considered**:
- Clerk `publicMetadata.role`: requires Clerk SDK call on every request; env var is
  simpler and sufficient.
- Supabase role table: additional DB round-trip; rejected for simplicity.

---

## Decision 5: Skin Catalog — External API Caching Strategy

**Decision**: Cache external API responses using Next.js `unstable_cache` with a
revalidation period (e.g. 1 hour). The `/api/skins` route proxies the cached result
to the browser. No database table needed for skin cache in v1.

**Rationale**: The spec marks the external Fortnite API as unreliable. `unstable_cache`
provides stale-while-revalidate semantics on Vercel's edge cache with zero additional
infrastructure. If the external source is down, the last cached response is served.

**Alternatives considered**:
- Database-backed `skins_cache` table: durable across deploys but adds write overhead
  and migration complexity for non-critical data.
- No caching (direct proxy): fails on every catalog load when external API is down.

### Update (2026-05-01) — switched from `/v2/cosmetics/br` to `/v2/shop`

The original implementation hit `https://fortnite-api.com/v2/cosmetics/br`, which
returns every cosmetic ever released with no V-Bucks price. We were inventing a
rarity-to-price mapping in code, which violates the spirit of FR-010 ("display the
V-Bucks cost"). We now hit `https://fortnite-api.com/v2/shop` instead, which returns
the **live** item shop with the **real** `regularPrice` and `finalPrice` per offer.

Trade-off: the catalog rotates daily and is much smaller. We consider this an
improvement — orders are placed against an offer that is actually purchasable, and
the displayed price is authoritative. Bundles, single-skin offers, and discounted
items are all surfaced naturally without per-item logic.

---

## Decision 6: Atomic Order Creation — Balance Deduction + Order Insert

**Decision**: Wrap V-Bucks deduction and order insert in a Postgres transaction via
a single RPC call (`buy_skin` function). The function checks balance ≥ cost, decrements
balance, inserts the order row, and raises an exception if any step fails — all in one
atomic operation.

**Rationale**: Application-level two-step (deduct then insert) is subject to partial
failure. A single database function guarantees atomicity without requiring Supabase's
transaction API from the application layer.

**Alternatives considered**:
- Supabase JS transaction with `BEGIN/COMMIT`: supported but requires multiple round-trips;
  a function is cleaner and enforced at the DB level.

---

## Decision 7: Testing Stack

**Decision**: Vitest for unit tests, Playwright for E2E.

**Rationale**: `docs/TESTING.md` mandates this stack. Vitest is co-located with the
Next.js project and shares the same TypeScript config. Playwright runs against a real
test Supabase project — no DB mocking in E2E.

---

## Decision 8: User Profile Sync

**Decision**: On first sign-in, a client-side effect calls `POST /api/user/sync` to
upsert the `profiles` row. This is the only mechanism for profile creation.

**Rationale**: `docs/AUTH.md` defines this pattern. Clerk webhooks are an alternative
but require an additional public endpoint and webhook secret management.

---

## All NEEDS CLARIFICATION Items Resolved

No open clarification markers remain. All architectural decisions are sourced from
the project's domain docs (`docs/DATABASE.md`, `docs/AUTH.md`, `docs/PAYMENTS.md`,
`docs/TESTING.md`) or from standard Next.js/Supabase/Stripe best practices.
