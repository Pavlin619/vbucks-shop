import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { updateFriendRequestStatus } from '@/services/admin';
import type { FriendRequestStatus } from '@/types';

const VALID_STATUSES: readonly FriendRequestStatus[] = ['not_sent', 'pending', 'accepted'];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { sessionClaims } = await auth.protect();

  if (sessionClaims?.metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { status } = (body as { status?: unknown }) ?? {};

  if (!VALID_STATUSES.includes(status as FriendRequestStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    await updateFriendRequestStatus(userId, status as FriendRequestStatus);
  } catch (err) {
    console.error('[admin/friend-request] updateFriendRequestStatus failed', err);
    return NextResponse.json(
      { error: 'Profile not found or update failed' },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
