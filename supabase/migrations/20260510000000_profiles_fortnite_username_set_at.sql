ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS fortnite_username_set_at timestamptz;
