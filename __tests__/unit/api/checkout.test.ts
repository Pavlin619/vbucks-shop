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

vi.mock('@/services/wallet', () => ({
  getProfile: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { getProfile } from '@/services/wallet';
import { POST } from '@/app/api/checkout/route';

const mockAuthProtect = vi.mocked(auth.protect);
const mockSessionCreate = vi.mocked(stripe.checkout.sessions.create);
const mockGetProfile = vi.mocked(getProfile);

const makeRequest = (body: unknown) =>
  new Request('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const validItems = [{ packId: '1000', quantity: 1 }];

const validProfile = {
  id: 'user_abc',
  fortnite_username: 'NinjaPlayer123',
  phone_number: null,
  vbucks_balance: 5000,
  friend_request_status: 'accepted' as const,
  friend_request_accepted_at: '2026-04-17T00:00:00Z',
  created_at: '2026-04-17T00:00:00Z',
  updated_at: '2026-04-17T00:00:00Z',
};

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    mockGetProfile.mockResolvedValue(validProfile);
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

  it('returns 422 when the user has no Fortnite username set', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockGetProfile.mockResolvedValue({ ...validProfile, fortnite_username: null });

    const res = await POST(makeRequest({ items: validItems }));

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body).toEqual({ error: 'fortnite_username_required' });
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
    );
  });

  it('passes client_reference_id and restricts to card (enables Apple/Google Pay)', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockSessionCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/x' } as never);

    await POST(makeRequest({ items: validItems }));

    const [params] = mockSessionCreate.mock.calls[0];
    expect(params).toMatchObject({
      client_reference_id: 'user_abc',
      payment_method_types: ['card'],
    });
  });

  /**
   * Regression: a static idempotency key per (userId + cart) caused Stripe to
   * return the already-completed first session when the same pack was purchased
   * again. The cart would be cleared but no VBucks credited on the second buy.
   */
  it('creates a fresh Stripe session when the same pack is bought again', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockSessionCreate
      .mockResolvedValueOnce({ url: 'https://checkout.stripe.com/sess_1' } as never)
      .mockResolvedValueOnce({ url: 'https://checkout.stripe.com/sess_2' } as never);

    const res1 = await POST(makeRequest({ items: validItems }));
    const res2 = await POST(makeRequest({ items: validItems }));

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect((await res1.json()).url).toBe('https://checkout.stripe.com/sess_1');
    expect((await res2.json()).url).toBe('https://checkout.stripe.com/sess_2');
    expect(mockSessionCreate).toHaveBeenCalledTimes(2);
  });

  it('returns 500 when Stripe throws', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockSessionCreate.mockRejectedValue(new Error('Stripe unavailable'));

    const res = await POST(makeRequest({ items: validItems }));

    expect(res.status).toBe(500);
  });
});
