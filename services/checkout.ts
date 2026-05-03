import 'server-only';
import { stripe } from '@/lib/stripe';
import { getPackById } from '@/lib/vbucks-packs';

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

/**
 * Validate the cart, build Stripe line items, and create a Checkout Session.
 *
 * Pure server-side orchestration: no auth (the route handler does that)
 * and no HTTP shape — returns a discriminated result the caller maps to
 * a `NextResponse`. Stripe failures are caught and reported via the
 * `STRIPE_FAILED` variant so the route stays free of try/catch noise.
 */
export async function createCheckoutSession({
  userId,
  items,
  appUrl,
}: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResult> {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, reason: 'EMPTY_CART' };
  }

  let totalVbucks = 0;
  const lineItems: {
    price_data: { currency: string; unit_amount: number; product_data: { name: string } };
    quantity: number;
  }[] = [];

  for (const raw of items) {
    const item = raw as Partial<CheckoutItemInput>;
    const pack = item.packId ? getPackById(item.packId) : undefined;
    const quantity = item.quantity;

    if (!pack || !Number.isInteger(quantity) || (quantity ?? 0) < 1) {
      return { ok: false, reason: 'INVALID_PACK', packId: String(item.packId) };
    }

    // Narrowed by the guard above: `quantity` is a positive integer here.
    const qty = quantity as number;

    totalVbucks += pack.vbucks * qty;
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
      payment_method_types: ['card'],
      line_items: lineItems,
      metadata: { userId, vbucks: String(totalVbucks) },
      success_url: `${appUrl}/checkout/success`,
      cancel_url: `${appUrl}/checkout/cancel`,
    });

    // Stripe types `url` as nullable; in `mode: 'payment'` with a fresh
    // session it's always populated, but treat it as a failure if not.
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
