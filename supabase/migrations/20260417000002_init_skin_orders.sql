-- skin_orders table. NOTE: `user_id` is converted from uuid to text in
-- 20260501_user_id_uuid_to_text.sql.

CREATE TABLE IF NOT EXISTS skin_orders (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES profiles(id),
  skin_id     text        NOT NULL,
  skin_name   text        NOT NULL,
  vbucks_cost integer     NOT NULL CHECK (vbucks_cost > 0),
  status      text        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'gifted', 'refunded')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz NULL  -- set when status → gifted or refunded
);

-- Enable Row Level Security
ALTER TABLE skin_orders ENABLE ROW LEVEL SECURITY;

-- All reads and writes go through the service role key (API routes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'skin_orders' AND policyname = 'skin_orders_select_own'
  ) THEN
    CREATE POLICY skin_orders_select_own
      ON skin_orders
      FOR SELECT
      USING (false);  -- service role bypasses; block anon reads
  END IF;
END;
$$;
