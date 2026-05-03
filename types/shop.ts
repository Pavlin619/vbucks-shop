/**
 * Width/height of a tile in shop-grid columns/rows. Mirrors Fortnite's
 * own `tileSize` field — bundles often take 2x1 or 2x2 to give the artwork
 * more room to breathe. `1x1` is the default.
 */
export type ShopTileSize = '1x1' | '2x1' | '1x2' | '2x2' | '3x1' | '3x2';

/**
 * A single entry from the live Fortnite item shop (`/v2/shop`).
 * Each shop "entry" is one offer the user can buy — sometimes a single skin,
 * sometimes a bundle of cosmetics. We persist `offerId` as the snapshot
 * identifier when the user places an order.
 */
export interface ShopEntry {
  offerId: string;
  name: string;
  description: string | null;
  image_url: string;
  rarity: string;
  vbucks_cost: number;
  regular_price: number;
  layout: string | null;
  /** Layout grouping order — lower numbers come first. Null = unknown. */
  layout_rank: number | null;
  /** Within-layout ordering hint from the API (`sortPriority`). */
  sort_priority: number;
  tile_size: ShopTileSize;
  /**
   * CSS-ready hex colors (e.g. `#3a306c`) sourced from the shop entry's
   * `colors` block. We render a diagonal gradient from `color1` → `color3`
   * behind each tile — this is what gives Epic's UI its identifiable look.
   */
  colors: {
    color1: string;
    color3: string;
    text_background: string;
  };
}

/**
 * A grouped slice of the shop — one Fortnite "section" / layout.
 * Used by the catalog UI to render the section header + tile grid pattern.
 */
export interface ShopSection {
  layoutId: string;
  layoutName: string;
  rank: number;
  entries: ShopEntry[];
}
