import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getPackById } from '@/lib/vbucks-packs';

interface CartItem {
  packId: string;
  quantity: number;
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { items } = body as { items?: CartItem[] };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  // Validate every packId and compute totals
  let totalVbucks = 0;
  const lineItems = [];

  for (const item of items) {
    const pack = getPackById(item.packId);
    
    if (!pack || !Number.isInteger(item.quantity) || item.quantity < 1) {
      return NextResponse.json({ error: `Invalid packId: ${item.packId}` }, { status: 400 });
    }

    totalVbucks += pack.vbucks * item.quantity;
    lineItems.push({
      price_data: {
        currency: 'eur',
        unit_amount: pack.price_cents,
        product_data: { name: pack.label },
      },
      quantity: item.quantity,
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      metadata: {
        userId,
        vbucks: String(totalVbucks),
      },
      success_url: `${appUrl}/checkout/success`,
      cancel_url: `${appUrl}/checkout/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[checkout] Stripe error', err);
    return NextResponse.json({ error: 'Payment service unavailable' }, { status: 500 });
  }
}
