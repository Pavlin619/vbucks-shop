import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ paid: false });
    }

    // Stripe says paid — check whether the webhook has already run and
    // written the purchases row. If not, tell the client to keep polling.
    const { data } = await supabaseAdmin
      .from('purchases')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    if (data) {
      return NextResponse.json({ paid: true });
    }

    return NextResponse.json({ paid: false, pending: true });
  } catch {
    return NextResponse.json({ paid: false }, { status: 400 });
  }
}
