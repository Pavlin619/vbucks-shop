# Data Model: VBucks Shop Core System

**Feature**: 001-vbucks-shop-core
**Phase**: 1 — Design
**Date**: 2026-04-17
**Source**: docs/DATABASE.md + spec.md entities

---

## Tables

### `profiles`

One row per registered user. Keyed on Clerk userId (not Supabase auth).

| Column             | Type      | Constraints                          | Notes                                 |
|--------------------|-----------|--------------------------------------|---------------------------------------|
| `id`               | `uuid`    | PRIMARY KEY                          | Equals Clerk userId exactly           |
| `fortnite_username`| `text`    | NULLABLE                             | Must be set before skin purchase      |
| `vbucks_balance`   | `integer` | NOT NULL DEFAULT 0, CHECK (>= 0)     | Mutated only via `increment_vbucks`   |
| `created_at`       | `timestamptz` | NOT NULL DEFAULT now()           |                                       |
| `updated_at`       | `timestamptz` | NOT NULL DEFAULT now()           | Updated by trigger on any row change  |

**RLS policies**:
- `SELECT`: user can read own row only (`id = auth.uid()` is not used — Clerk userId
  is passed via service-role calls; RLS for `profiles` restricts anon reads to own row
  using a custom claim or via service role exclusively).
- `INSERT`/`UPDATE`/`DELETE`: service role only (no client writes).

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

## Database Functions

### `increment_vbucks(p_user_id uuid, p_amount integer) → void`

Atomically adds `p_amount` to `profiles.vbucks_balance` for the given user.

```sql
CREATE OR REPLACE FUNCTION increment_vbucks(p_user_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles
  SET vbucks_balance = vbucks_balance + p_amount,
      updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found: %', p_user_id;
  END IF;

  -- The CHECK (vbucks_balance >= 0) constraint on the column will raise
  -- automatically if the result would be negative.
END;
$$;
```

Called by: Stripe webhook handler (credit) and admin refund handler (credit).

---

### `buy_skin(p_user_id uuid, p_skin_id text, p_skin_name text, p_vbucks_cost integer) → uuid`

Atomic skin purchase: deducts balance and creates order in a single transaction.
Returns the new order's `id`.

```sql
CREATE OR REPLACE FUNCTION buy_skin(
  p_user_id     uuid,
  p_skin_id     text,
  p_skin_name   text,
  p_vbucks_cost integer
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  -- Deduct balance (raises if balance < cost via CHECK constraint)
  UPDATE profiles
  SET vbucks_balance = vbucks_balance - p_vbucks_cost,
      updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found: %', p_user_id;
  END IF;

  -- Create order
  INSERT INTO skin_orders (user_id, skin_id, skin_name, vbucks_cost, status)
  VALUES (p_user_id, p_skin_id, p_skin_name, p_vbucks_cost, 'pending')
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;
```

Called by: `POST /api/orders` route.

---

## Migrations

File convention: `supabase/migrations/YYYYMMDD_description.sql`
All statements use `IF NOT EXISTS` / `OR REPLACE` — must be idempotent.

Planned migration files:

| File | Contents |
|------|----------|
| `20260417_init_profiles.sql` | `profiles` table, RLS policies, `updated_at` trigger |
| `20260417_init_purchases.sql` | `purchases` table, RLS policies |
| `20260417_init_skin_orders.sql` | `skin_orders` table, RLS policies |
| `20260417_functions.sql` | `increment_vbucks` and `buy_skin` functions |

---

## Entity Relationships

```
profiles (1) ──── (many) purchases
profiles (1) ──── (many) skin_orders
```

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

export interface Profile {
  id: string;
  fortnite_username: string | null;
  vbucks_balance: number;
  created_at: string;
  updated_at: string;
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

export interface Skin {
  id: string;
  name: string;
  image_url: string;
  rarity: string;
  vbucks_cost: number;
}

export interface VBucksPack {
  id: string;
  vbucks: number;
  price_cents: number;
  label: string;
}
```
