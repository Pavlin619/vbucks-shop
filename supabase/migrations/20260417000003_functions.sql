-- Migration: database functions for atomic balance mutations
-- Idempotent: uses CREATE OR REPLACE

-- increment_vbucks: atomically credit V-Bucks to a user's wallet.
-- Called by: Stripe webhook handler (top-up) and admin refund handler.
CREATE OR REPLACE FUNCTION public.increment_vbucks(p_user_id uuid, p_amount integer)
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

  -- The CHECK (vbucks_balance >= 0) constraint will raise automatically
  -- if the result would be negative (used here only for credits, but safe).
END;
$$;

-- buy_skin: atomically deduct V-Bucks and create a skin order.
-- Returns the new order UUID.
-- Called by: POST /api/orders route handler.
CREATE OR REPLACE FUNCTION public.buy_skin(
  p_user_id     uuid,
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
  -- Deduct balance atomically.
  -- The CHECK (vbucks_balance >= 0) constraint raises if balance < cost.
  UPDATE public.profiles
  SET vbucks_balance = vbucks_balance - p_vbucks_cost,
      updated_at     = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found: %', p_user_id;
  END IF;

  -- Create the order in the same transaction.
  INSERT INTO public.skin_orders (user_id, skin_id, skin_name, vbucks_cost, status)
  VALUES (p_user_id, p_skin_id, p_skin_name, p_vbucks_cost, 'pending')
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;
