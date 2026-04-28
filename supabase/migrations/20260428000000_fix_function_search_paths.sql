-- Fix: function_search_path_mutable security warnings
-- Without SET search_path = '', a malicious actor could shadow built-in functions
-- by creating objects with matching names in a schema that appears earlier in
-- the search path. All references must be fully qualified when search_path = ''.

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
END;
$$;

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
