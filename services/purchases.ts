import 'server-only';
import type Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { syncProfile } from '@/services/wallet';

export type CreditPurchaseResult =
  | { ok: true; status: 'credited' | 'duplicate' | 'skipped_missing_metadata' }
  | { ok: false; reason: 'SYNC_FAILED' | 'CREDIT_FAILED' };

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
    console.error('[stripe webhook] missing metadata on session', session.id);
    return { ok: true, status: 'skipped_missing_metadata' };
  }

  const vbucksAmount = Number.parseInt(vbucks, 10);
  if (!Number.isInteger(vbucksAmount) || vbucksAmount <= 0) {
    console.error('[stripe webhook] invalid vbucks metadata', session.id, vbucks);
    return { ok: true, status: 'skipped_missing_metadata' };
  }

  const amountCents = session.amount_total ?? 0;

  try {
    await syncProfile(userId);
  } catch (err) {
    console.error('[stripe webhook] syncProfile failed', err);
    return { ok: false, reason: 'SYNC_FAILED' };
  }

  const { data, error } = await supabaseAdmin.rpc('credit_purchase', {
    p_user_id: userId,
    p_session_id: session.id,
    p_vbucks: vbucksAmount,
    p_amount_cents: amountCents,
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
