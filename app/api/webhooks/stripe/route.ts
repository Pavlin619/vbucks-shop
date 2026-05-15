import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getRequiredEnv } from '@/lib/env';
import { creditPurchase, flagAccountByPaymentIntent } from '@/services/purchases';
import { getProfile } from '@/services/wallet';
import {
  sendVBucksPurchaseNotificationToAdmin,
  sendAccountFlaggedNotificationToAdmin,
  sendVBucksConfirmationToCustomer,
} from '@/services/email';

// Must be disabled so Next.js gives us the raw body for signature verification.
export const dynamic = 'force-dynamic';

const CHARGEBACK_EVENTS = new Set([
  'charge.refunded',
  'charge.dispute.funds_withdrawn',
]);

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const result = await creditPurchase(session);

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 500 });
    }

    if (result.status === 'credited') {
      const userId = session.metadata?.userId;
      const vbucksAmount = Number.parseInt(session.metadata?.vbucks ?? '0', 10);
      const amountCents = session.amount_total ?? 0;
      const customerEmail = session.customer_details?.email ?? null;
      const adminEmails = (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (userId && vbucksAmount > 0) {
        waitUntil(
          getProfile(userId)
            .then(async (profile) => {
              const notifs: Promise<void>[] = [];
              if (adminEmails.length > 0) {
                notifs.push(
                  sendVBucksPurchaseNotificationToAdmin(
                    adminEmails,
                    profile.fortnite_username ?? userId,
                    vbucksAmount,
                  ),
                );
              }
              if (customerEmail) {
                notifs.push(
                  sendVBucksConfirmationToCustomer(customerEmail, vbucksAmount, amountCents),
                );
              }
              await Promise.allSettled(notifs);
            })
            .catch((err) =>
              console.error('[stripe webhook] post-credit email notification failed', err),
            ),
        );
      }
    }

    return NextResponse.json({ received: true });
  }

  if (CHARGEBACK_EVENTS.has(event.type)) {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId =
      typeof charge.payment_intent === 'string' ? charge.payment_intent : null;

    if (!paymentIntentId) {
      console.error('[stripe webhook] chargeback event missing payment_intent', event.id);
      return NextResponse.json({ received: true });
    }

    const flagResult = await flagAccountByPaymentIntent(paymentIntentId);

    if (!flagResult.ok && flagResult.reason === 'DB_ERROR') {
      return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 });
    }

    if (flagResult.ok) {
      const adminEmails = (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (adminEmails.length > 0) {
        waitUntil(
          sendAccountFlaggedNotificationToAdmin(
            adminEmails,
            paymentIntentId,
            `Stripe event: ${event.type}`,
          ).catch((err) =>
            console.error('[stripe webhook] chargeback email notification failed', err),
          ),
        );
      }
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
