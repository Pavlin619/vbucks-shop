import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/stripe', () => ({
  stripe: { checkout: { sessions: { create: vi.fn() } } },
}));

import { stripe } from '@/lib/stripe';
import { createCheckoutSession } from '@/services/checkout';

const mockCreate = vi.mocked(stripe.checkout.sessions.create);

const BASE_INPUT = {
  userId: 'user_abc',
  appUrl: 'http://localhost:3000',
};

describe('createCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns EMPTY_CART when items is an empty array', async () => {
    const result = await createCheckoutSession({ ...BASE_INPUT, items: [] });
    expect(result).toEqual({ ok: false, reason: 'EMPTY_CART' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns EMPTY_CART when items is not an array', async () => {
    const result = await createCheckoutSession({ ...BASE_INPUT, items: null });
    expect(result).toEqual({ ok: false, reason: 'EMPTY_CART' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns INVALID_PACK for an unknown packId', async () => {
    const result = await createCheckoutSession({
      ...BASE_INPUT,
      items: [{ packId: 'nonexistent', quantity: 1 }],
    });
    expect(result).toEqual({ ok: false, reason: 'INVALID_PACK', packId: 'nonexistent' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns INVALID_PACK when quantity is not a positive integer', async () => {
    const result = await createCheckoutSession({
      ...BASE_INPUT,
      items: [{ packId: '1000', quantity: 0 }],
    });
    expect(result).toEqual({ ok: false, reason: 'INVALID_PACK', packId: '1000' });
  });

  it('returns the Stripe checkout URL on success', async () => {
    mockCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/sess_1' } as never);

    const result = await createCheckoutSession({
      ...BASE_INPUT,
      items: [{ packId: '1000', quantity: 1 }],
    });

    expect(result).toEqual({ ok: true, url: 'https://checkout.stripe.com/sess_1' });
  });

  it('calls Stripe with correct metadata and line items', async () => {
    mockCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/x' } as never);

    await createCheckoutSession({
      ...BASE_INPUT,
      items: [{ packId: '1500', quantity: 1 }],
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { userId: 'user_abc', vbucks: '1500' },
        client_reference_id: 'user_abc',
      }),
    );
  });

  it('returns STRIPE_FAILED when Stripe throws', async () => {
    mockCreate.mockRejectedValue(new Error('network error'));

    const result = await createCheckoutSession({
      ...BASE_INPUT,
      items: [{ packId: '1000', quantity: 1 }],
    });

    expect(result).toEqual({ ok: false, reason: 'STRIPE_FAILED' });
  });

  it('returns STRIPE_FAILED when Stripe returns a session without a URL', async () => {
    mockCreate.mockResolvedValue({ url: null } as never);

    const result = await createCheckoutSession({
      ...BASE_INPUT,
      items: [{ packId: '1000', quantity: 1 }],
    });

    expect(result).toEqual({ ok: false, reason: 'STRIPE_FAILED' });
  });

  /**
   * Regression: a static idempotency key per (userId + cart) caused Stripe to
   * return the already-completed first session on repurchase. The second buy
   * would clear the cart but credit no VBucks because the webhook had already
   * run. Fix: no static key — each purchase attempt calls Stripe fresh.
   */
  it('makes a fresh Stripe API call for each purchase, even when the cart is identical', async () => {
    mockCreate
      .mockResolvedValueOnce({ url: 'https://checkout.stripe.com/sess_1' } as never)
      .mockResolvedValueOnce({ url: 'https://checkout.stripe.com/sess_2' } as never);

    const items = [{ packId: '1500', quantity: 1 }];

    const first = await createCheckoutSession({ ...BASE_INPUT, items });
    const second = await createCheckoutSession({ ...BASE_INPUT, items });

    expect(first).toEqual({ ok: true, url: 'https://checkout.stripe.com/sess_1' });
    expect(second).toEqual({ ok: true, url: 'https://checkout.stripe.com/sess_2' });
    expect(mockCreate).toHaveBeenCalledTimes(2);

    // No static idempotency key — if one were present and equal for both
    // calls, Stripe would return the cached (potentially completed) session.
    const firstOptions = mockCreate.mock.calls[0][1];
    const secondOptions = mockCreate.mock.calls[1][1];
    expect(firstOptions?.idempotencyKey).toBeUndefined();
    expect(secondOptions?.idempotencyKey).toBeUndefined();
  });
});
