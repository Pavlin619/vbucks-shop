import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createOrder } from '@/services/orders';

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
