-- Add friend request tracking columns to profiles.
-- Only the service role may write these columns — the existing RLS policy
-- allows no direct client mutations on profiles (service role only).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS friend_request_status text
    NOT NULL DEFAULT 'not_sent'
    CONSTRAINT profiles_friend_request_status_check
    CHECK (friend_request_status IN ('not_sent', 'pending', 'accepted')),
  ADD COLUMN IF NOT EXISTS friend_request_accepted_at timestamptz;
