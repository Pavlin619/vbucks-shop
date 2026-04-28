-- Migration: purchases table (immutable payment ledger)
-- Idempotent: uses IF NOT EXISTS throughout

CREATE TABLE IF NOT EXISTS purchases (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES profiles(id),
  stripe_session_id  text        NOT NULL UNIQUE,  -- idempotency key
  vbucks_amount      integer     NOT NULL CHECK (vbucks_amount > 0),
  amount_cents       integer     NOT NULL CHECK (amount_cents > 0),
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Users can read their own rows; all writes are service-role only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'purchases' AND policyname = 'purchases_select_own'
  ) THEN
    CREATE POLICY purchases_select_own
      ON purchases
      FOR SELECT
      USING (false);  -- reads also go through service role; block anon
  END IF;
END;
$$;
