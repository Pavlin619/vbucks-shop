import { describe, it, expect } from 'vitest';
import {
  TILE_SPAN,
  TILE_ASPECT,
  FALLBACK_COLORS,
  tileLayout,
} from '@/app/(shop)/item-shop/_lib/tile-size';

describe('tileLayout', () => {
  it('returns the matching span + aspect for each known tile size', () => {
    const sizes = ['1x1', '2x1', '1x2', '2x2', '3x1', '3x2'] as const;
    for (const size of sizes) {
      expect(tileLayout(size)).toEqual({
        span: TILE_SPAN[size],
        aspect: TILE_ASPECT[size],
      });
    }
  });
});

describe('FALLBACK_COLORS', () => {
  it('exposes color1, color3, text_background as CSS hex strings', () => {
    expect(FALLBACK_COLORS.color1).toMatch(/^#[0-9a-f]{6}$/i);
    expect(FALLBACK_COLORS.color3).toMatch(/^#[0-9a-f]{6}$/i);
    expect(FALLBACK_COLORS.text_background).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
