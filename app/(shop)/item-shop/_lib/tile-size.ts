import type { ShopTileSize } from '@/types';

/**
 * Tailwind grid spans for each tile size. The shop grid is a 4-column
 * responsive grid (2 on mobile, 4 on md+), so anything wider than 2 is
 * clamped on small screens to avoid horizontal overflow.
 */
export const TILE_SPAN: Record<ShopTileSize, string> = {
  '1x1': 'col-span-1 row-span-1',
  '2x1': 'sm:col-span-2 row-span-1',
  '1x2': 'col-span-1 row-span-2',
  '2x2': 'sm:col-span-2 row-span-2',
  '3x1': 'sm:col-span-2 lg:col-span-3 row-span-1',
  '3x2': 'sm:col-span-2 lg:col-span-3 row-span-2',
};

/**
 * Aspect ratios per tile size. 1x1 tiles are taller-than-square so the
 * artwork has room to breathe above the price strip; wider/taller variants
 * flatten or stretch accordingly.
 */
export const TILE_ASPECT: Record<ShopTileSize, string> = {
  '1x1': 'aspect-[3/4]',
  '2x1': 'aspect-[3/2]',
  '1x2': 'aspect-[3/8]',
  '2x2': 'aspect-square',
  '3x1': 'aspect-[9/4]',
  '3x2': 'aspect-[3/2]',
};

/** Fallback theming if a shop entry is missing its colors block. */
export const FALLBACK_COLORS = {
  color1: '#36213e',
  color3: '#011627',
  text_background: '#36213e',
};

/** Resolve span + aspect classes with a safe `1x1` fallback. */
export function tileLayout(size: ShopTileSize): { span: string; aspect: string } {
  return {
    span: TILE_SPAN[size] ?? TILE_SPAN['1x1'],
    aspect: TILE_ASPECT[size] ?? TILE_ASPECT['1x1'],
  };
}
