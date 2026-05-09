import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createOrder } from '@/services/orders';
import { sendOrderPlacedNotificationToAdmin } from '@/services/email';

export async function POST(req: Request) {
  const { userId } = await auth.protect();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawSkinId = (body as { skinId?: unknown } | null)?.skinId;
  if (typeof rawSkinId !== 'string' || rawSkinId.trim() === '') {
    return NextResponse.json(
      { error: 'skinId is required' },
      { status: 400 },
    );
  }

  const skinId = rawSkinId.trim();
  const result = await createOrder(userId, skinId);

  if (result.ok) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (adminEmails.length > 0) {
      sendOrderPlacedNotificationToAdmin(
        adminEmails,
        userId,
        result.skinName,
        result.vbucksCost,
      ).catch((err) => console.error('[api/orders] admin email failed', err));
    }

    return NextResponse.json(
      {
        orderId: result.orderId,
        skinName: result.skinName,
        vbucksCost: result.vbucksCost,
        remainingBalance: result.remainingBalance,
      },
      { status: 201 },
    );
  }

  switch (result.reason) {
    case 'USERNAME_NOT_SET':
      return NextResponse.json(
        { error: 'Fortnite username not set' },
        { status: 422 },
      );
    case 'ACCESS_GATE_BLOCKED':
      return NextResponse.json(
        { error: 'Item Shop access requirements not met' },
        { status: 403 },
      );
    case 'SKIN_NOT_FOUND':
      return NextResponse.json(
        { error: 'Skin not found in catalog' },
        { status: 404 },
      );
    case 'INSUFFICIENT_BALANCE':
      return NextResponse.json(
        {
          error: 'Insufficient V-Bucks balance',
          balance: result.balance,
          cost: result.cost,
        },
        { status: 409 },
      );
    case 'DB_ERROR':
      return NextResponse.json(
        { error: 'Order placement failed' },
        { status: 500 },
      );
  }
}
