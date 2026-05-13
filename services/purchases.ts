import 'server-only';
import type Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type FlagAccountResult =
  | { ok: true }
  | { ok: false; reason: 'NOT_FOUND' | 'DB_ERROR' };

/**
 * Look up the user whose purchase matches payment_intent_id and mark their
 * profile as flagged. Called when Stripe fires a chargeback or refund event.
 */
export async function flagAccountByPaymentIntent(
  paymentIntentId: string,
): Promise<FlagAccountResult> {
  const { data: purchase, error: lookupError } = await supabaseAdmin
    .from('purchases')
    .select('user_id')
    .eq('payment_intent_id', paymentIntentId)
    .maybeSingle();

  if (lookupError) {
    console.error('[services/purchases] flagAccountByPaymentIntent lookup failed', lookupError.message);
    return { ok: false, reason: 'DB_ERROR' };
  }

  if (!purchase) {
    console.error('[services/purchases] flagAccountByPaymentIntent: no purchase found for', paymentIntentId);
    return { ok: false, reason: 'NOT_FOUND' };
  }

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ is_flagged: true })
    .eq('id', purchase.user_id);

  if (updateError) {
    console.error('[services/purchases] flagAccountByPaymentIntent update failed', updateError.message);
    return { ok: false, reason: 'DB_ERROR' };
  }

  return { ok: true };
}

export type CreditPurchaseResult =
  | { ok: true; status: 'credited' | 'duplicate' }
  | { ok: false; reason: 'CREDIT_FAILED' | 'MISSING_METADATA' };

/**
 * Idempotently credit a Stripe Checkout session to the user's V-Bucks
 * balance. Insert + balance update happen atomically inside the
 * `credit_purchase` RPC so a partial commit can't leave a paid user
 * uncredited.
 */
export async function creditPurchase(
  session: Stripe.Checkout.Session,
): Promise<CreditPurchaseResult> {
  const { userId, vbucks } = session.metadata ?? {};

  if (!userId || !vbucks) {
    // Returning a failure causes the webhook to return 500 so Stripe retries.
    // A real session from our checkout always has both fields — a missing one
    // signals something went wrong and deserves investigation.
    console.error('[stripe webhook] ALERT: missing metadata on session', session.id, { userId: !!userId, vbucks: !!vbucks });
    return { ok: false, reason: 'MISSING_METADATA' };
  }

  const vbucksAmount = Number.parseInt(vbucks, 10);
  if (!Number.isInteger(vbucksAmount) || vbucksAmount <= 0) {
    console.error('[stripe webhook] ALERT: invalid vbucks metadata on session', session.id, vbucks);
    return { ok: false, reason: 'MISSING_METADATA' };
  }

  const amountCents = session.amount_total ?? 0;
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : null;

  const { data, error } = await supabaseAdmin.rpc('credit_purchase', {
    p_user_id: userId,
    p_session_id: session.id,
    p_vbucks: vbucksAmount,
    p_amount_cents: amountCents,
    p_payment_intent_id: paymentIntentId,
  });

  if (error) {
    console.error('[stripe webhook] credit_purchase failed', error.message);
    return { ok: false, reason: 'CREDIT_FAILED' };
  }

  if (data === 'credited' || data === 'duplicate') {
    return { ok: true, status: data };
  }

  console.error('[stripe webhook] credit_purchase returned unexpected value', data);
  return { ok: false, reason: 'CREDIT_FAILED' };
}
