import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { fulfillOrder } from '@/services/orders';

type OrderAction = 'gifted' | 'refunded';
const VALID_ACTIONS: OrderAction[] = ['gifted', 'refunded'];

function getAdminUserIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { userId } = await auth.protect();

  if (!getAdminUserIds().includes(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = (body as { status?: unknown } | null)?.status;
  if (!VALID_ACTIONS.includes(action as OrderAction)) {
    return NextResponse.json({ error: 'status must be gifted or refunded' }, { status: 400 });
  }

  const { orderId } = await params;

  try {
    await fulfillOrder(orderId, action as OrderAction);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'Order not found') {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (message === 'Order is not pending') {
      return NextResponse.json({ error: 'Order is not pending' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
