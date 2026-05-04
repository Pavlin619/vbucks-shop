import { describe, it, expect, vi } from 'vitest';

// `services/checkout` transitively imports `lib/stripe`, which
// instantiates the SDK at module load and requires STRIPE_SECRET_KEY.
// We're only exercising the pure helper here, so stub the SDK out.
vi.mock('@/lib/stripe', () => ({
  stripe: { checkout: { sessions: { create: vi.fn() } } },
}));

import { buildIdempotencyKey } from '@/services/checkout';

describe('buildIdempotencyKey', () => {
  it('returns the same key for identical input', () => {
    const a = buildIdempotencyKey('user_abc', [{ packId: '1000', quantity: 1 }]);
    const b = buildIdempotencyKey('user_abc', [{ packId: '1000', quantity: 1 }]);
    expect(a).toBe(b);
  });

  it('is order-independent on the items array', () => {
    const a = buildIdempotencyKey('user_abc', [
      { packId: '1000', quantity: 1 },
      { packId: '500', quantity: 2 },
    ]);
    const b = buildIdempotencyKey('user_abc', [
      { packId: '500', quantity: 2 },
      { packId: '1000', quantity: 1 },
    ]);
    expect(a).toBe(b);
  });

  it('changes when the userId changes', () => {
    const a = buildIdempotencyKey('user_abc', [{ packId: '1000', quantity: 1 }]);
    const b = buildIdempotencyKey('user_xyz', [{ packId: '1000', quantity: 1 }]);
    expect(a).not.toBe(b);
  });

  it('changes when a quantity changes', () => {
    const a = buildIdempotencyKey('user_abc', [{ packId: '1000', quantity: 1 }]);
    const b = buildIdempotencyKey('user_abc', [{ packId: '1000', quantity: 2 }]);
    expect(a).not.toBe(b);
  });

  it('changes when the cart adds an item', () => {
    const a = buildIdempotencyKey('user_abc', [{ packId: '1000', quantity: 1 }]);
    const b = buildIdempotencyKey('user_abc', [
      { packId: '1000', quantity: 1 },
      { packId: '500', quantity: 1 },
    ]);
    expect(a).not.toBe(b);
  });

  it('produces a key well under the Stripe 255-char limit', () => {
    const key = buildIdempotencyKey('user_abc', [{ packId: '1000', quantity: 1 }]);
    expect(key.length).toBeLessThan(255);
    expect(key.startsWith('co_')).toBe(true);
  });
});
