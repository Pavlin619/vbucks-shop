# Payments

Stripe Checkout (hosted page — no custom card form, Stripe handles PCI).

## VBucks packs
Defined as a constant in `lib/vbucks-packs.ts` — not in the database.
Four packs: 200 / 500 / 1000 / 2800 VBucks. Prices in cents.

## Flow
1. User clicks buy → `POST /api/checkout` with packId
2. API validates packId, creates Stripe Checkout session with metadata: `{ userId, vbucks, packId }`
3. Browser redirects to Stripe hosted page
4. On success Stripe POSTs to `POST /api/webhooks/stripe`
5. Webhook: verify signature → idempotency check on `stripe_session_id` → insert purchase row → increment vbucks balance

## Rules
- Webhook must use raw request body for Stripe signature verification (do not parse as JSON first)
- Idempotency: check `purchases` table for `stripe_session_id` before crediting — Stripe can replay webhooks
- Throw on DB error in webhook handler so Stripe retries
- `POST /api/webhooks/stripe` must be excluded from Clerk middleware
- Use `increment_vbucks` Postgres function for the balance update (atomic, respects non-negative constraint)
- Never return raw Stripe error details to the client — log server-side only