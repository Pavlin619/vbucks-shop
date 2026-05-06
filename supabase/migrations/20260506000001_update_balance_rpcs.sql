-- increment_vbucks is no longer needed: its only caller (the fulfillOrder refund
-- path) is replaced by the atomic refund_order RPC below.
DROP FUNCTION IF EXISTS public.increment_vbucks(text, integer);

-- credit_purchase: record a wallet_transactions ledger entry in the same
-- transaction as the purchases insert and balance update.
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
  v_new_balance integer;
BEGIN
  INSERT INTO public.purchases (user_id, stripe_session_id, vbucks_amount, amount_cents)
  VALUES (p_user_id, p_session_id, p_vbucks, p_amount_cents)
  ON CONFLICT (stripe_session_id) DO NOTHING
  RETURNING id INTO v_inserted_id;

  -- Duplicate webhook delivery: idempotently do nothing.
  IF v_inserted_id IS NULL THEN
    RETURN 'duplicate';
  END IF;

  UPDATE public.profiles
  SET vbucks_balance = vbucks_balance + p_vbucks,
      updated_at     = now()
  WHERE id = p_user_id
  RETURNING vbucks_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found: %', p_user_id;
  END IF;

  INSERT INTO public.wallet_transactions (user_id, amount, type, reference_id, balance_after)
  VALUES (p_user_id, p_vbucks, 'stripe_credit', v_inserted_id, v_new_balance);

  RETURN 'credited';
END;
$$;

-- buy_skin: record a wallet_transactions ledger entry in the same transaction
-- as the balance deduction and order creation.
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
  v_order_id    uuid;
  v_new_balance integer;
BEGIN
  -- CHECK (vbucks_balance >= 0) raises SQLSTATE 23514 if balance < cost.
  UPDATE public.profiles
  SET vbucks_balance = vbucks_balance - p_vbucks_cost,
      updated_at     = now()
  WHERE id = p_user_id
  RETURNING vbucks_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found: %', p_user_id;
  END IF;

  INSERT INTO public.skin_orders (user_id, skin_id, skin_name, vbucks_cost, status)
  VALUES (p_user_id, p_skin_id, p_skin_name, p_vbucks_cost, 'pending')
  RETURNING id INTO v_order_id;

  INSERT INTO public.wallet_transactions (user_id, amount, type, reference_id, balance_after)
  VALUES (p_user_id, -p_vbucks_cost, 'skin_purchase', v_order_id, v_new_balance);

  RETURN v_order_id;
END;
$$;

-- refund_order: atomically mark a skin order as refunded, credit the user's
-- balance, and write the ledger entry.
-- Replaces the previous non-atomic two-step in fulfillOrder
-- (UPDATE skin_orders … then increment_vbucks), which could leave an order
-- marked refunded with no corresponding balance credit on failure.
CREATE OR REPLACE FUNCTION public.refund_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_order       record;
  v_new_balance integer;
BEGIN
  -- FOR UPDATE locks the row so concurrent refund calls for the same order
  -- queue up rather than both passing the pending check.
  SELECT id, user_id, vbucks_cost, status
  INTO v_order
  FROM public.skin_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'Order % is not pending (status: %)', p_order_id, v_order.status;
  END IF;

  UPDATE public.skin_orders
  SET status = 'refunded', resolved_at = now()
  WHERE id = p_order_id;

  UPDATE public.profiles
  SET vbucks_balance = vbucks_balance + v_order.vbucks_cost,
      updated_at     = now()
  WHERE id = v_order.user_id
  RETURNING vbucks_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found: %', v_order.user_id;
  END IF;

  INSERT INTO public.wallet_transactions (user_id, amount, type, reference_id, balance_after)
  VALUES (v_order.user_id, v_order.vbucks_cost, 'refund', p_order_id, v_new_balance);
END;
$$;
