-- profiles table. NOTE: `id` is converted from uuid to text in
-- 20260501_user_id_uuid_to_text.sql (Clerk userIds are not UUIDs).

CREATE TABLE IF NOT EXISTS profiles (
  id               uuid        PRIMARY KEY,
  fortnite_username text        NULL,
  vbucks_balance   integer     NOT NULL DEFAULT 0 CHECK (vbucks_balance >= 0),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'profiles_set_updated_at'
  ) THEN
    CREATE TRIGGER profiles_set_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own row only.
-- All writes go through the service role key (API routes).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'profiles_select_own'
  ) THEN
    CREATE POLICY profiles_select_own
      ON profiles
      FOR SELECT
      USING (false);  -- anon reads blocked; service role bypasses RLS entirely
  END IF;
END;
$$;
