-- Store payment_intent_id on purchases so we can look up the affected user
-- when Stripe fires a charge.refunded or charge.dispute webhook.
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS payment_intent_id text;

CREATE INDEX IF NOT EXISTS purchases_payment_intent_id_idx
  ON public.purchases (payment_intent_id);

-- Flag profiles that have triggered a Stripe chargeback so admins can review.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_flagged boolean NOT NULL DEFAULT false;

-- Update credit_purchase to accept and persist payment_intent_id.
CREATE OR REPLACE FUNCTION public.credit_purchase(
  p_user_id            text,
  p_session_id         text,
  p_vbucks             integer,
  p_amount_cents       integer,
  p_payment_intent_id  text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_inserted_id uuid;
BEGIN
  INSERT INTO public.purchases (user_id, stripe_session_id, vbucks_amount, amount_cents, payment_intent_id)
  VALUES (p_user_id, p_session_id, p_vbucks, p_amount_cents, p_payment_intent_id)
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
