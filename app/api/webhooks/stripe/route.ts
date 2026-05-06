import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getRequiredEnv } from '@/lib/env';
import { creditPurchase } from '@/services/purchases';
import { getProfile } from '@/services/wallet';
import { sendVBucksPurchaseNotificationToAdmin } from '@/services/email';

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

  if (result.status === 'credited') {
    const userId = session.metadata?.userId;
    const vbucksAmount = Number.parseInt(session.metadata?.vbucks ?? '0', 10);
    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (userId && vbucksAmount > 0 && adminEmails.length > 0) {
      getProfile(userId)
        .then((profile) =>
          sendVBucksPurchaseNotificationToAdmin(
            adminEmails,
            profile.fortnite_username ?? userId,
            vbucksAmount,
          ),
        )
        .catch((err) =>
          console.error('[stripe webhook] admin email notification failed', err),
        );
    }
  }

  return NextResponse.json({ received: true });
}
