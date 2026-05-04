import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => {
  const protect = vi.fn();
  const authFn = Object.assign(vi.fn(), { protect });
  return { auth: authFn };
});

vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { POST } from '@/app/api/checkout/route';

const mockAuthProtect = vi.mocked(auth.protect);
const mockSessionCreate = vi.mocked(stripe.checkout.sessions.create);

const makeRequest = (body: unknown) =>
  new Request('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const validItems = [{ packId: '1000', quantity: 1 }];

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  it('rejects unauthenticated requests via auth.protect (defence-in-depth)', async () => {
    // Middleware is the primary auth gate; auth.protect() in the route
    // is the defensive fallback. When unauth'd, Clerk's auth.protect()
    // throws (Next renders 404 / NEXT_NOT_FOUND). We verify the call IS
    // being made and that Stripe is not invoked.
    mockAuthProtect.mockRejectedValue(new Error('NEXT_NOT_FOUND'));

    await expect(POST(makeRequest({ items: validItems }))).rejects.toThrow();
    expect(mockAuthProtect).toHaveBeenCalled();
    expect(mockSessionCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when body is not valid JSON', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);

    const res = await POST(
      new Request('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      }),
    );

    expect(res.status).toBe(400);
    expect(mockSessionCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when items array is missing', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it('returns 400 when items array is empty', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);

    const res = await POST(makeRequest({ items: [] }));

    expect(res.status).toBe(400);
  });

  it('returns 400 for an unknown packId', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);

    const res = await POST(makeRequest({ items: [{ packId: 'invalid-pack', quantity: 1 }] }));

    expect(res.status).toBe(400);
  });

  it('returns 200 with Stripe checkout URL for a valid cart', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockSessionCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/test_session',
    } as never);

    const res = await POST(makeRequest({ items: validItems }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ url: 'https://checkout.stripe.com/test_session' });
  });

  it('passes correct total vbucks in metadata for a multi-item cart', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockSessionCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/x' } as never);

    // 1000 V-Bucks × 1 + 500 V-Bucks × 2 = 2000 V-Bucks
    await POST(makeRequest({
      items: [
        { packId: '1000', quantity: 1 },
        { packId: '500', quantity: 2 },
      ],
    }));

    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          userId: 'user_abc',
          vbucks: '2000',
        }),
      }),
      expect.any(Object),
    );
  });

  it('passes client_reference_id and lets Stripe pick payment methods', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockSessionCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/x' } as never);

    await POST(makeRequest({ items: validItems }));

    const [params] = mockSessionCreate.mock.calls[0];
    expect(params).toMatchObject({ client_reference_id: 'user_abc' });
    // Omitting `payment_method_types` lets Stripe use the dashboard
    // configuration (card + Link + Apple/Google Pay etc.) instead of
    // hard-coding to card-only.
    expect(params).not.toHaveProperty('payment_method_types');
  });

  it('passes a deterministic idempotencyKey for the same userId + cart', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockSessionCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/x' } as never);

    await POST(makeRequest({ items: validItems }));
    await POST(makeRequest({ items: validItems }));

    const firstKey = mockSessionCreate.mock.calls[0][1]?.idempotencyKey;
    const secondKey = mockSessionCreate.mock.calls[1][1]?.idempotencyKey;
    expect(firstKey).toBeTruthy();
    expect(typeof firstKey).toBe('string');
    expect(firstKey).toBe(secondKey);
  });

  it('uses a different idempotencyKey when the cart contents change', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockSessionCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/x' } as never);

    await POST(makeRequest({ items: [{ packId: '1000', quantity: 1 }] }));
    await POST(makeRequest({ items: [{ packId: '500', quantity: 1 }] }));

    const firstKey = mockSessionCreate.mock.calls[0][1]?.idempotencyKey;
    const secondKey = mockSessionCreate.mock.calls[1][1]?.idempotencyKey;
    expect(firstKey).not.toBe(secondKey);
  });

  it('returns 500 when Stripe throws', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockSessionCreate.mockRejectedValue(new Error('Stripe unavailable'));

    const res = await POST(makeRequest({ items: validItems }));

    expect(res.status).toBe(500);
  });
});
