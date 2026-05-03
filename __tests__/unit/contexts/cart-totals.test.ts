import { describe, it, expect } from 'vitest';
import { computeCartTotals } from '@/contexts/_lib/cart-totals';

describe('computeCartTotals', () => {
  it('returns zero totals for an empty cart', () => {
    expect(computeCartTotals([])).toEqual({
      totalItems: 0,
      totalVbucks: 0,
      totalCents: 0,
    });
  });

  it('sums quantities, V-Bucks, and cents across multiple packs', () => {
    // 1000 V-Bucks pack × 1 (€4.99) + 500 V-Bucks pack × 2 (€2.99 each)
    const totals = computeCartTotals([
      { packId: '1000', quantity: 1 },
      { packId: '500', quantity: 2 },
    ]);

    expect(totals).toEqual({
      totalItems: 3,
      totalVbucks: 1000 + 500 * 2,
      totalCents: 499 + 299 * 2,
    });
  });

  it('counts unknown packs in totalItems but contributes 0 to money totals', () => {
    const totals = computeCartTotals([
      { packId: 'does-not-exist', quantity: 5 },
      { packId: '1000', quantity: 1 },
    ]);

    expect(totals.totalItems).toBe(6);
    expect(totals.totalVbucks).toBe(1000);
    expect(totals.totalCents).toBe(499);
  });
});
