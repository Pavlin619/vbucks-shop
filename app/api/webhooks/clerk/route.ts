import { type NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { syncProfile } from '@/services/wallet';

// Must be disabled so Next.js gives us the raw body for signature verification.
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(req);
  } catch {
    console.error('[clerk webhook] signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'user.created') {
    try {
      await syncProfile(event.data.id);
    } catch (err) {
      console.error('[clerk webhook] syncProfile failed', err);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
