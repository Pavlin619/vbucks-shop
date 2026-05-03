import { describe, it, expect } from 'vitest';
import {
  formatVbucks,
  discountPercent,
} from '@/app/(shop)/item-shop/_lib/format';

describe('formatVbucks', () => {
  it('matches the runtime bg-BG locale formatting (defensive: ICU may vary)', () => {
    // We can't assert a specific separator because Node builds without
    // full-icu fall back to en-US-style grouping. Compare against the
    // platform's own toLocaleString to stay green everywhere.
    expect(formatVbucks(1500)).toBe((1500).toLocaleString('bg-BG'));
    expect(formatVbucks(0)).toBe('0');
  });
});

describe('discountPercent', () => {
  it('returns null when there is no discount (final >= regular)', () => {
    expect(discountPercent(1500, 1500)).toBeNull();
    expect(discountPercent(1500, 1600)).toBeNull();
  });

  it('returns null when regular price is non-positive (junk data)', () => {
    expect(discountPercent(0, 100)).toBeNull();
    expect(discountPercent(-1, 100)).toBeNull();
  });

  it('returns the rounded percent for a real discount', () => {
    // 2000 → 1000 = 50%
    expect(discountPercent(2000, 1000)).toBe(50);
    // 2000 → 1500 = 25%
    expect(discountPercent(2000, 1500)).toBe(25);
    // 1500 → 749 ≈ 50.07%, rounds to 50
    expect(discountPercent(1500, 749)).toBe(50);
  });
});
