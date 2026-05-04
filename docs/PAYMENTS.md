# Payments

Stripe Checkout (hosted page — no custom card form, Stripe handles PCI).

## VBucks packs
Defined as a constant in [`lib/vbucks-packs.ts`](../lib/vbucks-packs.ts) — not in the database.
Treat that file as the source of truth for which packs exist and how they're priced (in cents).

## Flow
1. User adds packs to the cart → `POST /api/checkout` with `{ items: [{ packId, quantity }] }`
2. API validates each `packId` via `getPackById`, builds line items, creates a Stripe Checkout session with metadata `{ userId, vbucks }`, and passes a deterministic `idempotencyKey` derived from `userId + sorted cart` (prevents double-charge on accidental retry)
3. Browser redirects to Stripe hosted page
4. On success Stripe POSTs to `POST /api/webhooks/stripe`
5. Webhook: verify signature → call `credit_purchase` RPC (atomic insert + balance increment in one transaction; idempotent on `stripe_session_id`)

## Rules
- Webhook must use the raw request body for signature verification (do not parse as JSON first)
- Idempotency lives at the DB level via `purchases.stripe_session_id UNIQUE` + the `credit_purchase` RPC's `ON CONFLICT DO NOTHING` — webhook handlers must NEVER do a separate "is this a duplicate?" SELECT before mutating, because that re-introduces the race window where a partial commit leaves a paid user uncredited.
- Return `500` from the webhook handler when the RPC fails so Stripe retries; return `200` when the metadata is missing/malformed (no point retrying a payload we can't process).
- `POST /api/webhooks/stripe` must be excluded from Clerk middleware (already in `isPublicRoute`).
- Stripe Checkout sessions are created without `payment_method_types` — Stripe surfaces every method enabled in the dashboard (card, Link, Apple/Google Pay) automatically.
- Pass `client_reference_id: userId` and `idempotencyKey` on every `sessions.create` call.
- Never return raw Stripe error details to the client — log server-side only.
