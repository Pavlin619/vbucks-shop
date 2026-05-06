import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createCheckoutSession } from '@/services/checkout';
import { getProfile } from '@/services/wallet';

export async function POST(req: Request) {
  // Middleware already gates unauthenticated callers with a 401. The
  // call here is defence-in-depth and narrows `userId` to a non-null
  // string for the rest of the handler.
  const { userId } = await auth.protect();

  const profile = await getProfile(userId);
  if (!profile.fortnite_username || profile.fortnite_username.trim() === '') {
    return NextResponse.json({ error: 'fortnite_username_required' }, { status: 422 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { items } = (body as { items?: unknown }) ?? {};

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const result = await createCheckoutSession({ userId, items, appUrl });

  if (result.ok) {
    return NextResponse.json({ url: result.url });
  }

  switch (result.reason) {
    case 'EMPTY_CART':
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    case 'INVALID_PACK':
      return NextResponse.json(
        { error: `Invalid packId: ${result.packId}` },
        { status: 400 },
      );
    case 'STRIPE_FAILED':
      return NextResponse.json(
        { error: 'Payment service unavailable' },
        { status: 500 },
      );
  }
}
