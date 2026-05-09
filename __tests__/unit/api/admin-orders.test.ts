import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => {
  const protect = vi.fn();
  const authFn = Object.assign(vi.fn(), { protect });
  return { auth: authFn };
});

vi.mock('@/services/orders', () => ({
  fulfillOrder: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { fulfillOrder } from '@/services/orders';
import { PATCH } from '@/app/api/admin/orders/[orderId]/route';

const mockAuthProtect = vi.mocked(auth.protect);
const mockFulfillOrder = vi.mocked(fulfillOrder);

const ADMIN_ID = 'admin_user_123';
const ORDER_ID = 'order_uuid_456';

const makeRequest = (body: unknown) =>
  new Request(`http://localhost/api/admin/orders/${ORDER_ID}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const makeParams = (orderId: string = ORDER_ID) =>
  Promise.resolve({ orderId });

describe('PATCH /api/admin/orders/[orderId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ADMIN_USER_IDS', ADMIN_ID);
  });

  afterEach(() => vi.unstubAllEnvs());

  it('rejects unauthenticated requests via auth.protect', async () => {
    mockAuthProtect.mockRejectedValue(new Error('NEXT_NOT_FOUND'));

    await expect(
      PATCH(makeRequest({ status: 'gifted' }), { params: makeParams() }),
    ).rejects.toThrow();

    expect(mockAuthProtect).toHaveBeenCalled();
    expect(mockFulfillOrder).not.toHaveBeenCalled();
  });

  it('returns 403 when the authenticated user is not an admin', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'regular_user_999' } as never);

    const res = await PATCH(makeRequest({ status: 'gifted' }), {
      params: makeParams(),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: 'Forbidden' });
    expect(mockFulfillOrder).not.toHaveBeenCalled();
  });

  it('returns 400 when the body is not valid JSON', async () => {
    mockAuthProtect.mockResolvedValue({ userId: ADMIN_ID } as never);

    const res = await PATCH(
      new Request(`http://localhost/api/admin/orders/${ORDER_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      }),
      { params: makeParams() },
    );

    expect(res.status).toBe(400);
    expect(mockFulfillOrder).not.toHaveBeenCalled();
  });

  it('returns 400 when status is not gifted or refunded', async () => {
    mockAuthProtect.mockResolvedValue({ userId: ADMIN_ID } as never);

    const res = await PATCH(makeRequest({ status: 'cancelled' }), {
      params: makeParams(),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/gifted or refunded/i);
    expect(mockFulfillOrder).not.toHaveBeenCalled();
  });

  it('returns 404 when order does not exist', async () => {
    mockAuthProtect.mockResolvedValue({ userId: ADMIN_ID } as never);
    mockFulfillOrder.mockRejectedValue(new Error('Order not found'));

    const res = await PATCH(makeRequest({ status: 'gifted' }), {
      params: makeParams(),
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: 'Order not found' });
  });

  it('returns 409 when order is not pending', async () => {
    mockAuthProtect.mockResolvedValue({ userId: ADMIN_ID } as never);
    mockFulfillOrder.mockRejectedValue(new Error('Order is not pending'));

    const res = await PATCH(makeRequest({ status: 'refunded' }), {
      params: makeParams(),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toEqual({ error: 'Order is not pending' });
  });

  it('returns 200 and delegates to fulfillOrder for gifted action', async () => {
    mockAuthProtect.mockResolvedValue({ userId: ADMIN_ID } as never);
    mockFulfillOrder.mockResolvedValue(undefined);

    const res = await PATCH(makeRequest({ status: 'gifted' }), {
      params: makeParams(),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    expect(mockFulfillOrder).toHaveBeenCalledWith(ORDER_ID, 'gifted');
  });

  it('returns 200 and delegates to fulfillOrder for refunded action', async () => {
    mockAuthProtect.mockResolvedValue({ userId: ADMIN_ID } as never);
    mockFulfillOrder.mockResolvedValue(undefined);

    const res = await PATCH(makeRequest({ status: 'refunded' }), {
      params: makeParams(),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    expect(mockFulfillOrder).toHaveBeenCalledWith(ORDER_ID, 'refunded');
  });

  it('returns 500 for unexpected errors', async () => {
    mockAuthProtect.mockResolvedValue({ userId: ADMIN_ID } as never);
    mockFulfillOrder.mockRejectedValue(new Error('Unexpected DB failure'));

    const res = await PATCH(makeRequest({ status: 'gifted' }), {
      params: makeParams(),
    });

    expect(res.status).toBe(500);
  });
});
