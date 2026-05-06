# Data Model: VBucks Shop Core System

**Feature**: 001-vbucks-shop-core
**Phase**: 1 — Design
**Date**: 2026-04-17
**Source**: docs/DATABASE.md + spec.md entities

---

## Tables

### `profiles`

One row per registered user. Keyed on Clerk userId (not Supabase auth).

| Column                       | Type          | Constraints                                                                    | Notes                                                      |
|------------------------------|---------------|--------------------------------------------------------------------------------|------------------------------------------------------------|
| `id`                         | `uuid`        | PRIMARY KEY                                                                    | Equals Clerk userId exactly                                |
| `fortnite_username`          | `text`        | NULLABLE                                                                       | Required before checkout or skin purchase                  |
| `vbucks_balance`             | `integer`     | NOT NULL DEFAULT 0, CHECK (>= 0)                                               | Mutated only via `increment_vbucks`                        |
| `friend_request_status`      | `text`        | NOT NULL DEFAULT 'not_sent', CHECK IN ('not_sent','pending','accepted')        | Admin toggles; drives item-shop access gate                |
| `friend_request_accepted_at` | `timestamptz` | NULLABLE                                                                       | Set when status → `accepted`; cleared when status changes away |
| `created_at`                 | `timestamptz` | NOT NULL DEFAULT now()                                                         |                                                            |
| `updated_at`                 | `timestamptz` | NOT NULL DEFAULT now()                                                         | Updated by trigger on any row change                       |

**RLS policies**:
- `SELECT`: user can read own row only (`id = auth.uid()` is not used — Clerk userId
  is passed via service-role calls; RLS for `profiles` restricts anon reads to own row
  using a custom claim or via service role exclusively).
- `INSERT`/`UPDATE`/`DELETE`: service role only (no client writes).

**State machine for `friend_request_status`**:
```
not_sent → pending   (admin sends friend request in-game)
pending  → accepted  (user accepted; sets friend_request_accepted_at = now())
accepted → pending   (admin resets — e.g. user removed admin from friends)
any      → not_sent  (admin resets fully; clears friend_request_accepted_at)
```

---

### `purchases`

Immutable ledger of confirmed Stripe payments. Never update or delete rows.

| Column              | Type          | Constraints                    | Notes                                      |
|---------------------|---------------|--------------------------------|--------------------------------------------|
| `id`                | `uuid`        | PRIMARY KEY DEFAULT gen_random_uuid() |                                     |
| `user_id`           | `uuid`        | NOT NULL, FK → profiles.id     |                                            |
| `stripe_session_id` | `text`        | NOT NULL, UNIQUE               | Idempotency key — prevents double-credit   |
| `vbucks_amount`     | `integer`     | NOT NULL, CHECK (> 0)          | V-Bucks credited to wallet                 |
| `amount_cents`      | `integer`     | NOT NULL, CHECK (> 0)          | Real money paid, in cents (USD)            |
| `created_at`        | `timestamptz` | NOT NULL DEFAULT now()         |                                            |

**RLS policies**:
- `SELECT`: user can read own rows only.
- `INSERT`: service role only (webhook handler).
- `UPDATE`/`DELETE`: nobody — immutable ledger.

---

### `skin_orders`

One row per skin purchase request.

| Column        | Type          | Constraints                                           | Notes                                  |
|---------------|---------------|-------------------------------------------------------|----------------------------------------|
| `id`          | `uuid`        | PRIMARY KEY DEFAULT gen_random_uuid()                 |                                        |
| `user_id`     | `uuid`        | NOT NULL, FK → profiles.id                            |                                        |
| `skin_id`     | `text`        | NOT NULL                                              | External catalog identifier            |
| `skin_name`   | `text`        | NOT NULL                                              | Snapshot at time of order              |
| `vbucks_cost` | `integer`     | NOT NULL, CHECK (> 0)                                 | Snapshot at time of order              |
| `status`      | `text`        | NOT NULL DEFAULT 'pending', CHECK IN ('pending','gifted','refunded') |           |
| `created_at`  | `timestamptz` | NOT NULL DEFAULT now()                                |                                        |
| `resolved_at` | `timestamptz` | NULLABLE                                              | Set when status → gifted or refunded   |

**RLS policies**:
- `SELECT`: user can read own rows only.
- `INSERT`: service role only (order creation API route).
- `UPDATE`: service role only (admin fulfillment API route).
- `DELETE`: nobody.

---

### `wallet_transactions`

Append-only VBucks ledger. Every balance mutation — Stripe top-up, skin purchase,
refund — writes one row here in the same DB transaction as the mutation.

| Column         | Type          | Constraints                                                                | Notes                                                                |
|----------------|---------------|----------------------------------------------------------------------------|----------------------------------------------------------------------|
| `id`           | `uuid`        | PRIMARY KEY DEFAULT gen_random_uuid()                                      |                                                                      |
| `user_id`      | `text`        | NOT NULL, FK → profiles.id                                                 |                                                                      |
| `amount`       | `integer`     | NOT NULL                                                                   | Positive = credit (`stripe_credit`, `refund`); negative = debit (`skin_purchase`) |
| `type`         | `text`        | NOT NULL, CHECK IN ('stripe_credit', 'skin_purchase', 'refund')            |                                                                      |
| `reference_id` | `uuid`        | NULLABLE                                                                   | `purchases.id` for `stripe_credit`; `skin_orders.id` for others     |
| `balance_after`| `integer`     | NOT NULL                                                                   | Cached `profiles.vbucks_balance` immediately after this mutation     |
| `created_at`   | `timestamptz` | NOT NULL DEFAULT now()                                                     |                                                                      |

`balance_after` is derived from `UPDATE … RETURNING vbucks_balance` inside each RPC, so it
is always consistent with the actual balance at that point in time.

**RLS policies**:
- `SELECT`: `USING (false)` — all reads go through the service role, which bypasses RLS.
- `INSERT`: service role only (via RPCs).
- `UPDATE`/`DELETE`: nobody — immutable ledger.

---

## Database Functions

### `increment_vbucks` — removed

Was used by the refund path but dropped once `refund_order` (below) made the
operation atomic. No longer present in the schema.

---

### `buy_skin(p_user_id text, p_skin_id text, p_skin_name text, p_vbucks_cost integer) → uuid`

Atomic skin purchase: deducts balance, creates order, and writes a `wallet_transactions`
ledger entry — all in one transaction. Returns the new order's `id`.

Called by: `POST /api/orders` route.

---

### `credit_purchase(p_user_id text, p_session_id text, p_vbucks integer, p_amount_cents integer) → text`

Idempotent Stripe credit: inserts a `purchases` row (ON CONFLICT DO NOTHING on
`stripe_session_id`), updates `profiles.vbucks_balance`, and writes a
`wallet_transactions` ledger entry — all in one transaction.

Returns `'credited'` or `'duplicate'`.

Called by: Stripe webhook handler.

---

### `refund_order(p_order_id uuid) → void`

Atomic refund: marks a `skin_orders` row as `'refunded'`, credits `profiles.vbucks_balance`,
and writes a `wallet_transactions` ledger entry — all in one transaction. Uses
`FOR UPDATE` on the order row to serialise concurrent refund attempts.

Replaces the previous non-atomic two-step (UPDATE status, then `increment_vbucks`),
which could leave an order marked refunded with no corresponding balance credit on failure.

Called by: admin fulfillment route (refund action).

---

## Migrations

File convention: `supabase/migrations/YYYYMMDD_description.sql`
All statements use `IF NOT EXISTS` / `OR REPLACE` — must be idempotent.

Planned migration files:

| File | Contents |
|------|----------|
| `20260417000000_init_profiles.sql` | `profiles` table, RLS policies, `updated_at` trigger |
| `20260417000001_init_purchases.sql` | `purchases` table, RLS policies |
| `20260417000002_init_skin_orders.sql` | `skin_orders` table, RLS policies |
| `20260417000003_functions.sql` | `increment_vbucks` and `buy_skin` functions (initial) |
| `20260501000000_user_id_uuid_to_text.sql` | Change all user_id columns from `uuid` → `text` for Clerk IDs |
| `20260504000000_credit_purchase_rpc.sql` | Atomic `credit_purchase` RPC (replaces two-step webhook flow) |
| `20260506000000_wallet_transactions.sql` | `wallet_transactions` ledger table, RLS, backfill from existing data |
| `20260506000001_update_balance_rpcs.sql` | Drop `increment_vbucks`; update `credit_purchase` and `buy_skin` to write ledger; add `refund_order` RPC |

---

## Entity Relationships

```
profiles (1) ──── (many) purchases
profiles (1) ──── (many) skin_orders
profiles (1) ──── (many) wallet_transactions
```

`wallet_transactions.reference_id` is a soft pointer — `purchases.id` for
`stripe_credit` rows, `skin_orders.id` for `skin_purchase` and `refund` rows.
No DB-level FK is enforced because the column is polymorphic.

No foreign key from `skin_orders` to an external skins table — skin details are
snapshotted at order time (`skin_id`, `skin_name`, `vbucks_cost`).

---

## State Transitions

### `skin_orders.status`

```
[created] → pending
pending   → gifted    (admin action: fulfillment)
pending   → refunded  (admin action: failure + V-Bucks refund)
gifted    → [terminal]
refunded  → [terminal]
```

No other transitions are permitted. The application enforces this by only allowing
status updates from `pending` in the admin fulfillment route.

---

## Type Mapping (`types/index.ts`)

```typescript
export type OrderStatus = 'pending' | 'gifted' | 'refunded';

export type FriendRequestStatus = 'not_sent' | 'pending' | 'accepted';

export interface Profile {
  id: string;
  fortnite_username: string | null;
  vbucks_balance: number;
  friend_request_status: FriendRequestStatus;
  friend_request_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Returned by services/admin.ts getRecentVBucksPurchasers()
export interface PurchaserWithStatus {
  purchase_id: string;
  user_id: string;
  fortnite_username: string | null;
  vbucks_amount: number;
  amount_cents: number;
  purchased_at: string;
  friend_request_status: FriendRequestStatus;
  friend_request_accepted_at: string | null;
}

// Returned by services/orders.ts getPendingOrders()
export interface SkinOrderWithUsername extends SkinOrder {
  fortnite_username: string | null;
}

export interface Purchase {
  id: string;
  user_id: string;
  stripe_session_id: string;
  vbucks_amount: number;
  amount_cents: number;
  created_at: string;
}

export interface SkinOrder {
  id: string;
  user_id: string;
  skin_id: string;
  skin_name: string;
  vbucks_cost: number;
  status: OrderStatus;
  created_at: string;
  resolved_at: string | null;
}

// NOTE (2026-05-01): The previous `Skin` shape was replaced with `ShopEntry`
// once the catalog source switched from `/v2/cosmetics/br` (every cosmetic
// ever, no prices) to `/v2/shop` (live item-shop entries with real prices).
// The new shape mirrors what an offer in the Fortnite shop actually is:
// either a single cosmetic or a bundle, always with a real V-Bucks price.
export interface ShopEntry {
  offerId: string;          // v2:/<hash> — snapshotted as skin_id at order time
  name: string;
  description: string | null;
  image_url: string;
  rarity: string;           // first brItem's rarity, or 'common' as a neutral fallback
  vbucks_cost: number;      // = finalPrice from /v2/shop
  regular_price: number;    // = regularPrice from /v2/shop (used for sale strikethrough)
  layout: string | null;    // shop layout name (e.g. "Battle Ready", "Jam Tracks")
}

export type WalletTransactionType = 'stripe_credit' | 'skin_purchase' | 'refund';

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;      // positive = credit, negative = debit
  type: WalletTransactionType;
  reference_id: string | null;   // purchases.id or skin_orders.id
  balance_after: number;
  created_at: string;
}

export interface VBucksPack {
  id: string;
  vbucks: number;
  price_cents: number;
  label: string;
}
```
