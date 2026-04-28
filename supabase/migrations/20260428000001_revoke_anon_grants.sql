-- Revoke all privileges from anon and authenticated on user-specific tables.
--
-- This project uses Clerk for auth and the service_role key for all data
-- access via Next.js API routes. The anon and authenticated roles are never
-- used for direct DB queries, so granting them any table access is unnecessary
-- exposure. The service_role (which bypasses RLS) retains full access.

REVOKE ALL ON public.profiles    FROM anon, authenticated;
REVOKE ALL ON public.purchases   FROM anon, authenticated;
REVOKE ALL ON public.skin_orders FROM anon, authenticated;
