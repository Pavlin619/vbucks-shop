# API Contracts: VBucks Shop Core System

**Feature**: 001-vbucks-shop-core
**Phase**: 1 — Design
**Date**: 2026-04-17

All routes validate: (1) Clerk auth, (2) request input, (3) business logic.
All routes return `{ error: string }` on failure with an appropriate HTTP status code.

---

## POST `/api/user/sync`

**Purpose**: Upsert the `profiles` row for the authenticated user on first sign-in.

**Auth**: Required (Clerk session). Triggered client-side once `isSignedIn === true`.

**Request body**: none

**Success response** `200`:
```json
{ "ok": true }
```

**Error responses**:
- `401` — not authenticated
- `500` — database error

**Notes**: Uses `INSERT ... ON CONFLICT (id) DO NOTHING`. Safe to call multiple times.

---

## POST `/api/checkout`

**Purpose**: Create a Stripe Checkout session for a V-Bucks bundle purchase.

**Auth**: Required (Clerk session).

**Request body**:
```json
{ "packId": "1000" }
```

**Validation**:
- `packId` must be one of the keys defined in `lib/vbucks-packs.ts`

**Success response** `200`:
```json
{ "url": "https://checkout.stripe.com/..." }
```

**Error responses**:
- `401` — not authenticated
- `400` — unknown packId
- `500` — Stripe API error (logged server-side only)

**Notes**:
- Stripe session metadata must include `userId` and `vbucks` for the webhook.
- `success_url` and `cancel_url` must be absolute URLs pointing back to the app.

---

## POST `/api/webhooks/stripe`

**Purpose**: Confirm Stripe payment and credit V-Bucks to the buyer's wallet.

**Auth**: Stripe webhook signature (raw body + `STRIPE_WEBHOOK_SECRET`).
**This route MUST be excluded from Clerk middleware.**

**Request body**: Raw Stripe event (do not parse as JSON before signature verification).

**Handled event**: `checkout.session.completed`

**Processing flow**:
1. Verify Stripe signature — return `400` on failure.
2. Extract `userId` and `vbucks` from session metadata.
3. Attempt `INSERT INTO purchases (stripe_session_id, ...)`.
4. On unique constraint violation: duplicate event — return `200` immediately.
5. Call `increment_vbucks(userId, vbucks)`.
6. On DB error: throw (Stripe will retry).

**Success response** `200`: `{ "received": true }`

**Error responses**:
- `400` — invalid signature
- `500` — DB error (causes Stripe retry)

---

## GET `/api/skins`

**Purpose**: Proxy the live Fortnite item shop (`/v2/shop`) from the external API,
cached server-side.

**Auth**: Required (Clerk session).

**Query params**: none (returns full live shop)

**Success response** `200`:
```json
{
  "entries": [
    {
      "offerId": "v2:/664253e72bac6aa6df0d666893014d2a30e5f519ca2c5f2af5973f9222ef0d3f",
      "name": "Ravenpool",
      "description": "Maximum darkness.",
      "image_url": "https://...",
      "rarity": "marvel",
      "vbucks_cost": 1500,
      "regular_price": 1500,
      "layout": "Deadpool Mashups"
    }
  ]
}
```

**Error responses**:
- `401` — not authenticated
- `502` — external API unavailable AND no cached data exists (edge case)

**Notes**:
- Response is cached via `unstable_cache` with a 1-hour revalidation period.
- Free entries (`finalPrice <= 0`), jam tracks, instruments, cars and lego kits
  are filtered out — only cosmetic offers (containing brItems and/or a bundle)
  are returned.
- External API credentials MUST NOT appear in the response.

---

## POST `/api/orders`

**Purpose**: Place a skin order, atomically deducting V-Bucks from the buyer's wallet.

**Auth**: Required (Clerk session).

**Pre-condition**: `profiles.fortnite_username` must not be null (enforced in route).

**Request body**:
```json
{ "skinId": "cid_xxx" }
```

**Validation**:
- `skinId` must be a non-empty string.
- Skin must exist in the cached catalog.
- User must have `vbucks_balance >= skin.vbucks_cost`.
- `fortnite_username` must be set on the user's profile.

**Processing**: Calls `buy_skin(userId, skinId, skinName, vbucksCost)` DB function.

**Success response** `201`:
```json
{ "orderId": "uuid" }
```

**Error responses**:
- `401` — not authenticated
- `400` — missing or invalid skinId
- `404` — skin not found in catalog
- `409` — insufficient V-Bucks balance
- `422` — fortnite_username not set
- `500` — DB error

---

## PATCH `/api/admin/orders/[orderId]`

**Purpose**: Admin marks a pending order as `gifted` or `refunded`.

**Auth**: Required (Clerk session) + admin check (`ADMIN_USER_IDS` env var).

**URL param**: `orderId` — UUID of the target order.

**Request body**:
```json
{ "status": "gifted" }
```
or
```json
{ "status": "refunded" }
```

**Validation**:
- `status` must be `"gifted"` or `"refunded"`.
- Order must exist and have `status = 'pending'`.

**Processing for `refunded`**:
1. Update `skin_orders.status = 'refunded'` and `resolved_at = now()`.
2. Call `increment_vbucks(order.user_id, order.vbucks_cost)`.
3. Send refund notification email via Resend.

**Processing for `gifted`**:
1. Update `skin_orders.status = 'gifted'` and `resolved_at = now()`.
2. Send fulfillment notification email via Resend.

Both steps wrapped in a single DB transaction where possible.

**Success response** `200`:
```json
{ "ok": true }
```

**Error responses**:
- `401` — not authenticated
- `403` — user not in `ADMIN_USER_IDS`
- `400` — invalid status value
- `404` — order not found
- `409` — order not in `pending` state
- `500` — DB or email error

---

## Server Actions (non-HTTP, used by Server Components / Forms)

These are Next.js Server Actions — they do not have HTTP route paths but follow
the same auth-first, validate-second, logic-third pattern.

| Action | File | Purpose |
|--------|------|---------|
| `setFortniteUsername` | `services/wallet.ts` | Update `profiles.fortnite_username` |
| `getProfile` | `services/wallet.ts` | Read own profile (balance + username) |
| `getOrders` | `services/orders.ts` | Read own order history |
| `getPendingOrders` | `services/orders.ts` | Admin: all pending orders |

Server Actions are preferred over API routes for these read/update operations that
do not require external callbacks.
