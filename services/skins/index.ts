import 'server-only';
import type { ShopEntry, ShopSection, ShopTileSize } from '@/types';
import type {
  RawShopEntry,
  RawShopResponse,
} from '@/services/skins/fortnite-api.types';

// Public endpoint provided by https://fortnite-api.com — returns the
// currently-live Fortnite item shop with real V-Bucks prices.
const FORTNITE_SHOP_URL = 'https://fortnite-api.com/v2/shop';

const FALLBACK_BG_COLOR = '#36213e';
const ORPHAN_LAYOUT_NAME = 'Други';
// Orphan section is pushed to the end by giving it a very large rank.
const ORPHAN_LAYOUT_RANK = Number.MAX_SAFE_INTEGER;

// ---------------------------------------------------------------------------
// Color + tile-size helpers — exported for tests
// ---------------------------------------------------------------------------

const HEX_PATTERN = /^[0-9a-f]+$/i;

/**
 * Convert a Fortnite-API color string (e.g. `"3a306cff"` or `"#5e40ce"`) into
 * a CSS-friendly hex like `"#3a306c"`. Trailing alpha bytes are stripped — we
 * apply opacity in CSS where needed instead. Falls back to a neutral purple
 * when given junk so a single bad value never breaks the grid.
 */
export function toCssHex(input: string | null | undefined): string {
  if (!input) return FALLBACK_BG_COLOR;
  const cleaned = input.startsWith('#') ? input.slice(1) : input;
  if (!HEX_PATTERN.test(cleaned)) return FALLBACK_BG_COLOR;

  // Trim alpha (8-char RRGGBBAA → 6-char RRGGBB). 6-char inputs pass through.
  const rgb = cleaned.length >= 6 ? cleaned.slice(0, 6) : null;
  if (!rgb) return FALLBACK_BG_COLOR;
  return `#${rgb.toLowerCase()}`;
}

const SUPPORTED_TILE_SIZES: ReadonlySet<ShopTileSize> = new Set([
  '1x1',
  '2x1',
  '1x2',
  '2x2',
  '3x1',
  '3x2',
]);

/**
 * Convert Fortnite's `Size_X_x_Y` string to our enum. Anything we don't yet
 * support (e.g. `Size_4_x_4`) is clamped to `1x1` rather than warping the
 * grid layout.
 */
export function parseTileSize(input: string | null | undefined): ShopTileSize {
  if (!input) return '1x1';
  const match = /^Size_(\d)_x_(\d)$/.exec(input);
  if (!match) return '1x1';
  const candidate = `${match[1]}x${match[2]}` as ShopTileSize;
  return SUPPORTED_TILE_SIZES.has(candidate) ? candidate : '1x1';
}

// ---------------------------------------------------------------------------
// Field pickers
// ---------------------------------------------------------------------------

function pickImage(entry: RawShopEntry): string | null {
  const renderImage = entry.newDisplayAsset?.renderImages?.[0]?.image?.trim();
  if (renderImage) return renderImage;

  if (entry.bundle?.image) {
    const bundleImage = entry.bundle.image.trim();
    if (bundleImage) return bundleImage;
  }

  for (const item of entry.brItems ?? []) {
    const featured = item.images?.featured?.trim();
    if (featured) return featured;
    const icon = item.images?.icon?.trim();
    if (icon) return icon;
  }

  return null;
}

function pickName(entry: RawShopEntry): string | null {
  const bundleName = entry.bundle?.name?.trim();
  if (bundleName) return bundleName;

  const firstItem = entry.brItems?.[0]?.name?.trim();
  if (firstItem) return firstItem;

  return null;
}

function pickRarity(entry: RawShopEntry): string {
  const rarity = entry.brItems?.[0]?.rarity?.value?.trim().toLowerCase();
  return rarity || 'common';
}

function pickDescription(entry: RawShopEntry): string | null {
  if (entry.bundle?.info) return entry.bundle.info;
  return entry.brItems?.[0]?.description ?? null;
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

export function mapShopEntry(entry: RawShopEntry): ShopEntry | null {
  const offerId = entry.offerId?.trim();
  if (!offerId) return null;

  const finalPrice = entry.finalPrice ?? 0;
  if (finalPrice <= 0) return null;

  const hasCosmetic =
    (entry.brItems && entry.brItems.length > 0) || Boolean(entry.bundle);
  if (!hasCosmetic) return null;

  const name = pickName(entry);
  const image = pickImage(entry);
  if (!name || !image) return null;

  const regularPrice = entry.regularPrice ?? finalPrice;

  const colorsRaw = entry.colors ?? {};
  return {
    offerId,
    name,
    description: pickDescription(entry),
    image_url: image,
    rarity: pickRarity(entry),
    vbucks_cost: finalPrice,
    regular_price: regularPrice,
    layout: entry.layout?.name?.trim() || null,
    layout_rank: typeof entry.layout?.rank === 'number' ? entry.layout.rank : null,
    sort_priority: typeof entry.sortPriority === 'number' ? entry.sortPriority : 0,
    tile_size: parseTileSize(entry.tileSize),
    colors: {
      color1: toCssHex(colorsRaw.color1),
      color3: toCssHex(colorsRaw.color3),
      text_background: toCssHex(colorsRaw.textBackgroundColor),
    },
  };
}

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

/**
 * Group flat entries into the section-of-tiles structure Epic uses. Sections
 * are sorted by layout `rank` ascending; within each section, entries are
 * sorted by their API `sort_priority` ascending — so promoted/featured offers
 * appear first within their section.
 */
export function groupByLayout(entries: ShopEntry[]): ShopSection[] {
  if (entries.length === 0) return [];

  const buckets = new Map<string, ShopSection>();
  for (const entry of entries) {
    const name = entry.layout ?? ORPHAN_LAYOUT_NAME;
    const rank = entry.layout_rank ?? ORPHAN_LAYOUT_RANK;
    // Use the layout name as the bucket key — the API can repeat the same
    // layout name across rotated `layoutId`s and we want them grouped.
    const key = name;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { layoutId: key, layoutName: name, rank, entries: [] };
      buckets.set(key, bucket);
    } else if (rank < bucket.rank) {
      // Use the lowest seen rank when entries disagree.
      bucket.rank = rank;
    }
    bucket.entries.push(entry);
  }

  const sections = Array.from(buckets.values());
  sections.sort((a, b) => a.rank - b.rank);
  for (const section of sections) {
    section.entries.sort((a, b) => a.sort_priority - b.sort_priority);
  }
  return sections;
}

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

/**
 * Returns the live Fortnite item shop, mapped to our ShopEntry type.
 *
 * NOTE: There is intentionally no caching here right now. Every call hits
 * the upstream Fortnite-API live. A proper caching strategy (CDN, tagged
 * `unstable_cache`, or a Supabase-backed snapshot) will land in a follow-up.
 *
 * Returns an empty array on failure — never throws — so the page can
 * render a graceful empty state (FR-011).
 */
export async function fetchShopEntries(): Promise<ShopEntry[]> {
  try {
    const res = await fetch(FORTNITE_SHOP_URL, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.error('[services/skins] Fortnite shop API returned non-2xx', res.status);
      return [];
    }

    const payload = (await res.json()) as RawShopResponse;
    const rawEntries = payload.data?.entries;
    if (!Array.isArray(rawEntries)) {
      console.error('[services/skins] Fortnite shop payload missing entries array');
      return [];
    }

    const entries: ShopEntry[] = [];
    for (const raw of rawEntries) {
      const mapped = mapShopEntry(raw);
      if (mapped) entries.push(mapped);
    }

    return entries;
  } catch (err) {
    console.error('[services/skins] fetch failed', err);
    return [];
  }
}
