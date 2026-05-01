import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { syncProfile } from '@/services/wallet';

// Must be disabled so Next.js gives us the raw body for signature verification.
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    console.error('[stripe webhook] signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const { userId, vbucks } = session.metadata ?? {};

  if (!userId || !vbucks) {
    console.error('[stripe webhook] missing metadata on session', session.id);
    // Return 200 — this is a data issue, retrying will not help.
    return NextResponse.json({ received: true });
  }

  const vbucksAmount = parseInt(vbucks, 10);
  const amountCents = session.amount_total ?? 0;

  // Idempotency: skip if this session was already processed
  const { data: existing } = await supabaseAdmin
    .from('purchases')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true });
  }

  // Ensure the profiles row exists before any FK/RPC calls
  try {
    await syncProfile(userId);
  } catch (err) {
    console.error('[stripe webhook] syncProfile failed', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  // Insert purchase row (FK requires profile to exist)
  const { error: insertError } = await supabaseAdmin
    .from('purchases')
    .insert({
      user_id: userId,
      stripe_session_id: session.id,
      vbucks_amount: vbucksAmount,
      amount_cents: amountCents,
    });

  if (insertError) {
    console.error('[stripe webhook] insert purchase failed', insertError.message);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  // Atomically credit V-Bucks balance
  const { error: rpcError } = await supabaseAdmin.rpc('increment_vbucks', {
    p_user_id: userId,
    p_amount: vbucksAmount,
  });

  if (rpcError) {
    console.error('[stripe webhook] increment_vbucks failed', rpcError.message);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
