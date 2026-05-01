-- Fix: Clerk user IDs are plain text strings (e.g. "user_abc123"), not UUIDs.
-- Change all user-identifier columns and function parameters from uuid → text.

BEGIN;

-- 1. Drop FK constraints that reference profiles.id
ALTER TABLE public.purchases   DROP CONSTRAINT IF EXISTS purchases_user_id_fkey;
ALTER TABLE public.skin_orders DROP CONSTRAINT IF EXISTS skin_orders_user_id_fkey;

-- 2. Alter profiles.id (PK) — existing uuid values cast cleanly to text
ALTER TABLE public.profiles    ALTER COLUMN id      TYPE text;

-- 3. Alter FK columns in dependent tables
ALTER TABLE public.purchases   ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.skin_orders ALTER COLUMN user_id TYPE text USING user_id::text;

-- 4. Restore FK constraints
ALTER TABLE public.purchases
  ADD CONSTRAINT purchases_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE public.skin_orders
  ADD CONSTRAINT skin_orders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- 5. Drop old functions — CREATE OR REPLACE requires identical signature,
--    so we must drop the uuid-parameter versions first.
DROP FUNCTION IF EXISTS public.increment_vbucks(uuid, integer);
DROP FUNCTION IF EXISTS public.buy_skin(uuid, text, text, integer);

-- 6. Recreate functions with text parameter types
CREATE OR REPLACE FUNCTION public.increment_vbucks(p_user_id text, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET vbucks_balance = vbucks_balance + p_amount,
      updated_at     = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found: %', p_user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.buy_skin(
  p_user_id     text,
  p_skin_id     text,
  p_skin_name   text,
  p_vbucks_cost integer
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  UPDATE public.profiles
  SET vbucks_balance = vbucks_balance - p_vbucks_cost,
      updated_at     = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found: %', p_user_id;
  END IF;

  INSERT INTO public.skin_orders (user_id, skin_id, skin_name, vbucks_cost, status)
  VALUES (p_user_id, p_skin_id, p_skin_name, p_vbucks_cost, 'pending')
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

COMMIT;
