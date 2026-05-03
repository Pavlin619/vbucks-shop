import 'server-only';
import type Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { syncProfile } from '@/services/wallet';

export type CreditPurchaseResult =
  | { ok: true; status: 'credited' | 'duplicate' | 'skipped_missing_metadata' }
  | { ok: false; reason: 'SYNC_FAILED' | 'INSERT_FAILED' | 'CREDIT_FAILED' };

/**
 * Idempotently credit a Stripe Checkout session to the user's V-Bucks
 * balance. Performs in order:
 *   1. Skip silently if the session is missing required metadata.
 *   2. Skip if a `purchases` row already exists for this session id.
 *   3. Ensure a `profiles` row exists (FK requirement for purchases).
 *   4. Insert the purchases row.
 *   5. Atomically increment the balance via the `increment_vbucks` RPC.
 *
 * Each step that fails returns a discriminated `ok: false` variant so the
 * caller can decide between 200 (skip / duplicate) and 500 (retry).
 */
export async function creditPurchase(
  session: Stripe.Checkout.Session,
): Promise<CreditPurchaseResult> {
  const { userId, vbucks } = session.metadata ?? {};

  if (!userId || !vbucks) {
    console.error('[stripe webhook] missing metadata on session', session.id);
    return { ok: true, status: 'skipped_missing_metadata' };
  }

  const vbucksAmount = parseInt(vbucks, 10);
  const amountCents = session.amount_total ?? 0;

  const { data: existing } = await supabaseAdmin
    .from('purchases')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle();

  if (existing) {
    return { ok: true, status: 'duplicate' };
  }

  try {
    await syncProfile(userId);
  } catch (err) {
    console.error('[stripe webhook] syncProfile failed', err);
    return { ok: false, reason: 'SYNC_FAILED' };
  }

  const { error: insertError } = await supabaseAdmin.from('purchases').insert({
    user_id: userId,
    stripe_session_id: session.id,
    vbucks_amount: vbucksAmount,
    amount_cents: amountCents,
  });

  if (insertError) {
    console.error('[stripe webhook] insert purchase failed', insertError.message);
    return { ok: false, reason: 'INSERT_FAILED' };
  }

  const { error: rpcError } = await supabaseAdmin.rpc('increment_vbucks', {
    p_user_id: userId,
    p_amount: vbucksAmount,
  });

  if (rpcError) {
    console.error('[stripe webhook] increment_vbucks failed', rpcError.message);
    return { ok: false, reason: 'CREDIT_FAILED' };
  }

  return { ok: true, status: 'credited' };
}
