import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getRequiredEnv } from '@/lib/env';
import { creditPurchase } from '@/services/purchases';

// Must be disabled so Next.js gives us the raw body for signature verification.
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      getRequiredEnv('STRIPE_WEBHOOK_SECRET'),
    );
  } catch {
    console.error('[stripe webhook] signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const result = await creditPurchase(session);

  if (!result.ok) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
