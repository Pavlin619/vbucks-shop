-- credit_purchase: atomic purchases insert + balance credit. The
-- previous two-step (INSERT then RPC) had a race window where a crash
-- between steps left a paid user uncredited and the duplicate check
-- short-circuited future retries. ON CONFLICT DO NOTHING + RETURNING
-- makes the insert idempotent at the DB level; we credit only when a
-- new row was written.

CREATE OR REPLACE FUNCTION public.credit_purchase(
  p_user_id      text,
  p_session_id   text,
  p_vbucks       integer,
  p_amount_cents integer
)
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_inserted_id uuid;
BEGIN
  INSERT INTO public.purchases (user_id, stripe_session_id, vbucks_amount, amount_cents)
  VALUES (p_user_id, p_session_id, p_vbucks, p_amount_cents)
  ON CONFLICT (stripe_session_id) DO NOTHING
  RETURNING id INTO v_inserted_id;

  IF v_inserted_id IS NULL THEN
    RETURN 'duplicate';
  END IF;

  UPDATE public.profiles
  SET vbucks_balance = vbucks_balance + p_vbucks,
      updated_at     = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found: %', p_user_id;
  END IF;

  RETURN 'credited';
END;
$$;
