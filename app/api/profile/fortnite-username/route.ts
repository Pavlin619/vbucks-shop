import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { updateFortniteUsername } from '@/services/wallet';
import { sendFriendRequestNeededNotificationToAdmin } from '@/services/email';
import { isValidFortniteUsername } from '@/lib/fortnite-username';

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

  const username = fortnite_username.trim();

  if (!isValidFortniteUsername(username)) {
    return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
  }
  await updateFortniteUsername(userId, username);

  // Notify admins non-blocking — errors must not fail the user's save.
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (adminEmails.length > 0) {
    sendFriendRequestNeededNotificationToAdmin(adminEmails, username).catch((err) =>
      console.error('[api/profile/fortnite-username] notification failed', err),
    );
  }

  return NextResponse.json({ ok: true });
}
