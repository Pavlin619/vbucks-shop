import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/rate-limit', () => ({
  ordersLimiter: () => ({ limit: vi.fn().mockResolvedValue({ success: true }) }),
}));

vi.mock('@clerk/nextjs/server', () => {
  const protect = vi.fn();
  const authFn = Object.assign(vi.fn(), { protect });
  const clerkClientFn = vi.fn().mockResolvedValue({
    users: {
      getUser: vi.fn().mockResolvedValue({
        emailAddresses: [{ emailAddress: 'user@example.com' }],
      }),
    },
  });
  return { auth: authFn, clerkClient: clerkClientFn };
});

vi.mock('@/services/orders', () => ({
  createOrder: vi.fn(),
}));

vi.mock('@/services/email', () => ({
  sendOrderPlacedNotificationToAdmin: vi.fn().mockResolvedValue(undefined),
  sendSkinOrderConfirmationToCustomer: vi.fn().mockResolvedValue(undefined),
}));

import { auth } from '@clerk/nextjs/server';
import { createOrder } from '@/services/orders';
import { sendOrderPlacedNotificationToAdmin } from '@/services/email';
import { POST } from '@/app/api/orders/route';

const mockAuthProtect = vi.mocked(auth.protect);
const mockCreateOrder = vi.mocked(createOrder);
const mockSendAdminEmail = vi.mocked(sendOrderPlacedNotificationToAdmin);

const VALID_OFFER_ID =
  'v2:/664253e72bac6aa6df0d666893014d2a30e5f519ca2c5f2af5973f9222ef0d3f';

const makeRequest = (body: unknown) =>
  new Request('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests via auth.protect (defence-in-depth)', async () => {
    // Middleware is the primary auth gate; auth.protect() in the route
    // is the defensive fallback. When unauth'd, Clerk's auth.protect()
    // throws (Next renders 404 / NEXT_NOT_FOUND). We just need to verify
    // the call IS being made and that business logic is short-circuited.
    mockAuthProtect.mockRejectedValue(new Error('NEXT_NOT_FOUND'));

    await expect(
      POST(makeRequest({ skinId: VALID_OFFER_ID })),
    ).rejects.toThrow();
    expect(mockAuthProtect).toHaveBeenCalled();
    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  it('returns 400 when the body is not valid JSON', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);

    const res = await POST(
      new Request('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      }),
    );

    expect(res.status).toBe(400);
    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  it('returns 400 when skinId is missing', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  it('returns 400 when skinId is an empty string', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);

    const res = await POST(makeRequest({ skinId: '   ' }));

    expect(res.status).toBe(400);
    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  it('returns 403 when the access gate blocks the order (friend request pending or waiting period)', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockCreateOrder.mockResolvedValue({ ok: false, reason: 'ACCESS_GATE_BLOCKED' });

    const res = await POST(makeRequest({ skinId: VALID_OFFER_ID }));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: 'Item Shop access requirements not met' });
  });

  it('returns 422 when the user has no Fortnite username', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockCreateOrder.mockResolvedValue({ ok: false, reason: 'USERNAME_NOT_SET' });

    const res = await POST(makeRequest({ skinId: VALID_OFFER_ID }));

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body).toEqual({ error: 'Fortnite username not set' });
  });

  it('returns 404 when the skin is not in the catalog', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockCreateOrder.mockResolvedValue({ ok: false, reason: 'SKIN_NOT_FOUND' });

    const res = await POST(makeRequest({ skinId: 'v2:/missing' }));

    expect(res.status).toBe(404);
  });

  it('returns 409 when balance is insufficient', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockCreateOrder.mockResolvedValue({
      ok: false,
      reason: 'INSUFFICIENT_BALANCE',
      balance: 500,
      cost: 1500,
    });

    const res = await POST(makeRequest({ skinId: VALID_OFFER_ID }));

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toEqual({
      error: 'Insufficient V-Bucks balance',
      balance: 500,
      cost: 1500,
    });
  });

  it('returns 500 when the database call fails', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockCreateOrder.mockResolvedValue({ ok: false, reason: 'DB_ERROR' });

    const res = await POST(makeRequest({ skinId: VALID_OFFER_ID }));

    expect(res.status).toBe(500);
  });

  it('returns 201 with the new orderId on success', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockCreateOrder.mockResolvedValue({
      ok: true,
      orderId: 'order_uuid',
      skinName: 'Ravenpool',
      vbucksCost: 1500,
      remainingBalance: 3500,
    });

    const res = await POST(makeRequest({ skinId: VALID_OFFER_ID }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({
      orderId: 'order_uuid',
      skinName: 'Ravenpool',
      vbucksCost: 1500,
      remainingBalance: 3500,
    });
    expect(mockCreateOrder).toHaveBeenCalledWith('user_abc', VALID_OFFER_ID);
  });

  it('trims whitespace around the skinId before delegating', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockCreateOrder.mockResolvedValue({
      ok: true,
      orderId: 'order_uuid',
      skinName: 'Ravenpool',
      vbucksCost: 1500,
      remainingBalance: 3500,
    });

    await POST(makeRequest({ skinId: `  ${VALID_OFFER_ID}  ` }));

    expect(mockCreateOrder).toHaveBeenCalledWith('user_abc', VALID_OFFER_ID);
  });

  it('fires admin email notification on successful order', async () => {
    vi.stubEnv('ADMIN_EMAILS', 'admin@example.com,ops@example.com');
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockCreateOrder.mockResolvedValue({
      ok: true,
      orderId: 'order_uuid',
      skinName: 'Ravenpool',
      vbucksCost: 1500,
      remainingBalance: 3500,
    });

    await POST(makeRequest({ skinId: VALID_OFFER_ID }));

    // Allow the fire-and-forget promise to settle
    await new Promise((r) => setTimeout(r, 0));

    expect(mockSendAdminEmail).toHaveBeenCalledWith(
      ['admin@example.com', 'ops@example.com'],
      'user_abc',
      'Ravenpool',
      1500,
    );

    vi.unstubAllEnvs();
  });

  it('does not fire admin email when ADMIN_EMAILS is empty', async () => {
    vi.stubEnv('ADMIN_EMAILS', '');
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockCreateOrder.mockResolvedValue({
      ok: true,
      orderId: 'order_uuid',
      skinName: 'Ravenpool',
      vbucksCost: 1500,
      remainingBalance: 3500,
    });

    await POST(makeRequest({ skinId: VALID_OFFER_ID }));
    await new Promise((r) => setTimeout(r, 0));

    expect(mockSendAdminEmail).not.toHaveBeenCalled();

    vi.unstubAllEnvs();
  });
});
