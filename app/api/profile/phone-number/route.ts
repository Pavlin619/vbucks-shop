import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { savePhoneNumber } from '@/services/wallet';
import { isValidPhone } from '@/lib/phone';

export async function PUT(req: Request) {
  const { userId } = await auth.protect();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { phone_number } = (body as { phone_number?: unknown }) ?? {};

  if (typeof phone_number !== 'string' || !phone_number.trim()) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
  }

  const phone = phone_number.trim();

  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
  }

  await savePhoneNumber(userId, phone);

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { onboardingComplete: true },
  });

  return NextResponse.json({ ok: true });
}
