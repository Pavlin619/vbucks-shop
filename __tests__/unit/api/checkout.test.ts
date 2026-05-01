import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

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

const mockAuth = vi.mocked(auth);
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

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null } as never);

    const res = await POST(makeRequest({ items: validItems }));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when items array is missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_abc' } as never);

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it('returns 400 when items array is empty', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_abc' } as never);

    const res = await POST(makeRequest({ items: [] }));

    expect(res.status).toBe(400);
  });

  it('returns 400 for an unknown packId', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_abc' } as never);

    const res = await POST(makeRequest({ items: [{ packId: 'invalid-pack', quantity: 1 }] }));

    expect(res.status).toBe(400);
  });

  it('returns 200 with Stripe checkout URL for a valid cart', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_abc' } as never);
    mockSessionCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/test_session',
    } as never);

    const res = await POST(makeRequest({ items: validItems }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ url: 'https://checkout.stripe.com/test_session' });
  });

  it('passes correct total vbucks in metadata for a multi-item cart', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_abc' } as never);
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
    );
  });

  it('returns 500 when Stripe throws', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_abc' } as never);
    mockSessionCreate.mockRejectedValue(new Error('Stripe unavailable'));

    const res = await POST(makeRequest({ items: validItems }));

    expect(res.status).toBe(500);
  });
});
