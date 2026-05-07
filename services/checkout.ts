import 'server-only';
import { stripe } from '@/lib/stripe';
import { getPackById } from '@/lib/vbucks-packs';

const MAX_QUANTITY_PER_PACK = 10;

export interface CheckoutItemInput {
  packId: string;
  quantity: number;
}

export type CreateCheckoutSessionResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'EMPTY_CART' }
  | { ok: false; reason: 'INVALID_PACK'; packId: string }
  | { ok: false; reason: 'STRIPE_FAILED' };

interface CreateCheckoutSessionInput {
  userId: string;
  items: unknown;
  appUrl: string;
}

export async function createCheckoutSession({
  userId,
  items,
  appUrl,
}: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResult> {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, reason: 'EMPTY_CART' };
  }

  let totalVbucks = 0;
  const validatedItems: CheckoutItemInput[] = [];
  const lineItems: {
    price_data: { currency: string; unit_amount: number; product_data: { name: string } };
    quantity: number;
  }[] = [];

  for (const raw of items) {
    const item = raw as Partial<CheckoutItemInput>;
    const pack = item.packId ? getPackById(item.packId) : undefined;
    const quantity = item.quantity;

    if (
      !pack ||
      !Number.isInteger(quantity) ||
      (quantity ?? 0) < 1 ||
      (quantity ?? 0) > MAX_QUANTITY_PER_PACK
    ) {
      return { ok: false, reason: 'INVALID_PACK', packId: String(item.packId) };
    }

    // Narrowed by the guard above.
    const qty = quantity as number;

    totalVbucks += pack.vbucks * qty;
    validatedItems.push({ packId: pack.id, quantity: qty });
    lineItems.push({
      price_data: {
        currency: 'eur',
        unit_amount: pack.price_cents,
        product_data: { name: pack.label },
      },
      quantity: qty,
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Omitting `payment_method_types` lets Stripe surface every
      // method enabled in the dashboard (card, Link, Apple/Google Pay).
      client_reference_id: userId,
      line_items: lineItems,
      metadata: { userId, vbucks: String(totalVbucks) },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
    });

    if (!session.url) {
      console.error('[checkout] Stripe returned a session with no URL', session.id);
      return { ok: false, reason: 'STRIPE_FAILED' };
    }

    return { ok: true, url: session.url };
  } catch (err) {
    console.error('[checkout] Stripe error', err);
    return { ok: false, reason: 'STRIPE_FAILED' };
  }
}
