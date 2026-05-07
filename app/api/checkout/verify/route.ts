import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: Request) {
  const { userId } = await auth.protect();

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ paid: false }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    // Confirm this session was created for the requesting user, not someone else's.
    if (session.client_reference_id !== userId) {
      return NextResponse.json({ paid: false }, { status: 403 });
    }
    return NextResponse.json({ paid: session.payment_status === 'paid' });
  } catch {
    return NextResponse.json({ paid: false }, { status: 400 });
  }
}
