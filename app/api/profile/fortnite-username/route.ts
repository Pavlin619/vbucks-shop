import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { updateFortniteUsername } from '@/services/wallet';

export async function PUT(req: Request) {
  const { userId } = await auth.protect();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { fortnite_username } = (body as { fortnite_username?: unknown }) ?? {};

  if (typeof fortnite_username !== 'string' || !fortnite_username.trim()) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
  }

  await updateFortniteUsername(userId, fortnite_username.trim());
  return NextResponse.json({ ok: true });
}
