-- wallet_transactions: append-only VBucks ledger.
-- Each balance mutation writes one row here in the same DB transaction.
-- balance_after is the value of profiles.vbucks_balance captured via
-- UPDATE...RETURNING immediately after the mutation — always in sync.
-- The canonical balance remains profiles.vbucks_balance; this table provides
-- the audit trail needed to reconstruct or verify it.

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       text        NOT NULL REFERENCES public.profiles(id),
  amount        integer     NOT NULL,
  -- positive = credit (stripe_credit, refund); negative = debit (skin_purchase)
  type          text        NOT NULL CHECK (type IN ('stripe_credit', 'skin_purchase', 'refund')),
  reference_id  uuid        NULL,
  -- purchases.id for stripe_credit rows; skin_orders.id for skin_purchase and refund rows
  balance_after integer     NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'wallet_transactions'
      AND policyname = 'wallet_transactions_select_own'
  ) THEN
    CREATE POLICY wallet_transactions_select_own
      ON public.wallet_transactions
      FOR SELECT
      USING (false);  -- all reads go through service role, which bypasses RLS
  END IF;
END;
$$;

-- Backfill: reconstruct the ledger from purchases and skin_orders.
-- Running balance is derived from the ordered event stream per user;
-- (created_at, type, reference_id) gives a deterministic tiebreaker so the
-- backfill is idempotent (same rows every time, in the same order).
WITH ordered_events AS (
  SELECT
    user_id,
    vbucks_amount   AS amount,
    'stripe_credit' AS type,
    id              AS reference_id,
    created_at
  FROM public.purchases

  UNION ALL

  SELECT
    user_id,
    -vbucks_cost    AS amount,
    'skin_purchase' AS type,
    id              AS reference_id,
    created_at
  FROM public.skin_orders

  UNION ALL

  SELECT
    user_id,
    vbucks_cost     AS amount,
    'refund'        AS type,
    id              AS reference_id,
    resolved_at     AS created_at
  FROM public.skin_orders
  WHERE status = 'refunded'
    AND resolved_at IS NOT NULL
),
with_running_balance AS (
  SELECT
    user_id,
    amount,
    type,
    reference_id,
    created_at,
    SUM(amount) OVER (
      PARTITION BY user_id
      ORDER BY created_at, type, reference_id
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS balance_after
  FROM ordered_events
)
INSERT INTO public.wallet_transactions (user_id, amount, type, reference_id, balance_after, created_at)
SELECT user_id, amount, type::text, reference_id, balance_after, created_at
FROM with_running_balance;
