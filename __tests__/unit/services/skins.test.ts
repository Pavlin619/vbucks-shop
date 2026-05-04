import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchShopEntries,
  groupByLayout,
  mapShopEntry,
  parseTileSize,
  toCssHex,
} from '@/services/skins';
import type { ShopEntry, ShopSection } from '@/types';

// ---------------------------------------------------------------------------
// Real fixtures — derived from a captured /v2/shop response.
// ---------------------------------------------------------------------------

const RAVENPOOL_ENTRY = {
  regularPrice: 1500,
  finalPrice: 1500,
  offerId: 'v2:/664253e72bac6aa6df0d666893014d2a30e5f519ca2c5f2af5973f9222ef0d3f',
  layoutId: 'Fishpool.98',
  layout: { id: 'Fishpool', name: 'Deadpool Mashups', rank: 189, index: 1 },
  tileSize: 'Size_1_x_1',
  sortPriority: -1,
  colors: {
    color1: '274a59ff',
    color3: '10171aff',
    textBackgroundColor: '10171aff',
  },
  newDisplayAsset: {
    renderImages: [
      {
        productTag: 'Product.BR',
        image:
          'https://fortnite-api.com/images/cosmetics/br/newdisplayassets/b2eebee08432f2b6/renderimage_0.png',
      },
    ],
  },
  brItems: [
    {
      id: 'CID_745_Athena_Commando_M_RavenQuill',
      name: 'Ravenpool',
      description: 'Maximum darkness.',
      type: { value: 'outfit' },
      rarity: { value: 'marvel' },
      images: {
        icon: 'https://fortnite-api.com/images/cosmetics/br/cid_745.../icon.png',
        featured: 'https://fortnite-api.com/images/cosmetics/br/cid_745.../featured.png',
      },
    },
  ],
};

const FLUX_FLIER_ENTRY = {
  regularPrice: 800,
  finalPrice: 800,
  offerId: 'v2:/52a95b53737693a9059f1a2541c7fc18330c3413b5e509e5fda3978da327614c',
  layoutId: 'BR0501.97',
  layout: { id: 'BR0501', name: 'Battle Ready', rank: 184, index: 5 },
  tileSize: 'Size_1_x_1',
  sortPriority: -4,
  colors: {
    color1: '290f07ff',
    color3: '824100ff',
    textBackgroundColor: '824100ff',
  },
  newDisplayAsset: {
    renderImages: [
      {
        productTag: 'Product.BR',
        image:
          'https://fortnite-api.com/images/cosmetics/br/newdisplayassets/f2b2b506172fa72c/renderimage_0.png',
      },
    ],
  },
  brItems: [
    {
      id: 'Glider_ID_207_InformerMale',
      name: 'Flux Flier',
      description: 'Reality is always in flux.',
      type: { value: 'glider' },
      rarity: { value: 'rare' },
      images: {
        icon: 'https://fortnite-api.com/images/cosmetics/br/glider_id_207_informermale/icon.png',
        featured:
          'https://fortnite-api.com/images/cosmetics/br/glider_id_207_informermale/featured.png',
      },
    },
  ],
};

const ELITE_DAIGO_BUNDLE = {
  regularPrice: 2000,
  finalPrice: 1500,
  offerId: 'v2:/elite_daigo_bundle',
  layoutId: 'TheElites.98',
  layout: { id: 'TheElites', name: 'The Elites', rank: 100, index: 0 },
  tileSize: 'Size_2_x_1',
  sortPriority: -2,
  colors: {
    color1: '5e40ce',  // 6-char hex (no alpha) — must still parse
    color3: '3a306cff',
    textBackgroundColor: '694fc3ff',
  },
  bundle: {
    name: 'Elite Daigo Bundle',
    info: 'Bundle',
    image: 'https://fortnite-api.com/images/.../elite_daigo.png',
  },
  brItems: [
    {
      id: 'CID_DAIGO',
      name: 'Elite Daigo',
      type: { value: 'outfit' },
      rarity: { value: 'epic' },
      images: { icon: 'https://x/daigo.png' },
    },
  ],
};

const JAM_TRACK_ENTRY = {
  regularPrice: 500,
  finalPrice: 500,
  offerId: 'v2:/b517443289f6207aaf1db3c7753b2fecd609336a861477ff38efb62346b0feab',
  layout: { id: 'JT05011', name: 'Jam Tracks', rank: 183, index: 30 },
  tracks: [
    {
      id: 'sid_placeholder_726',
      title: 'Illegal',
      artist: 'PinkPantheress',
      albumArt: 'https://cdn.fortnite-api.com/tracks/35b82af93da18fec.jpg',
    },
  ],
};

const FREE_ENTRY = {
  regularPrice: 0,
  finalPrice: 0,
  offerId: 'v2:/free',
  brItems: [
    {
      id: 'CID_free',
      name: 'Free Skin',
      type: { value: 'outfit' },
      rarity: { value: 'rare' },
      images: { icon: 'https://x/free.png' },
    },
  ],
};

// ---------------------------------------------------------------------------
// toCssHex — alpha-stripped CSS-friendly hex
// ---------------------------------------------------------------------------

describe('services/skins — toCssHex', () => {
  it('strips the trailing 2-char alpha from an 8-char RRGGBBAA hex', () => {
    expect(toCssHex('3a306cff')).toBe('#3a306c');
  });

  it('passes through a 6-char hex unchanged (with leading #)', () => {
    expect(toCssHex('5e40ce')).toBe('#5e40ce');
  });

  it('handles values that already include a leading # ', () => {
    expect(toCssHex('#10171aff')).toBe('#10171a');
  });

  it('returns a sane fallback for empty / invalid input', () => {
    expect(toCssHex('')).toBe('#36213e');
    expect(toCssHex('xyz')).toBe('#36213e');
  });
});

// ---------------------------------------------------------------------------
// parseTileSize — Fortnite "Size_X_x_Y" → our enum
// ---------------------------------------------------------------------------

describe('services/skins — parseTileSize', () => {
  it('parses Size_1_x_1 to "1x1"', () => {
    expect(parseTileSize('Size_1_x_1')).toBe('1x1');
  });

  it('parses Size_2_x_1 to "2x1"', () => {
    expect(parseTileSize('Size_2_x_1')).toBe('2x1');
  });

  it('parses Size_2_x_2 to "2x2"', () => {
    expect(parseTileSize('Size_2_x_2')).toBe('2x2');
  });

  it('parses Size_3_x_1 to "3x1"', () => {
    expect(parseTileSize('Size_3_x_1')).toBe('3x1');
  });

  it('falls back to 1x1 for unknown / missing values', () => {
    expect(parseTileSize(undefined)).toBe('1x1');
    expect(parseTileSize('Weird')).toBe('1x1');
    // Anything bigger than 3x2 is clamped to 1x1 — we don't yet support
    // exotic layouts. This is intentional and noted in the service.
    expect(parseTileSize('Size_4_x_4')).toBe('1x1');
  });
});

// ---------------------------------------------------------------------------
// mapShopEntry — full mapping
// ---------------------------------------------------------------------------

describe('services/skins — mapShopEntry', () => {
  it('maps a single-skin shop entry with all the new visual fields', () => {
    const result = mapShopEntry(FLUX_FLIER_ENTRY);

    expect(result).toEqual<ShopEntry>({
      offerId: FLUX_FLIER_ENTRY.offerId,
      name: 'Flux Flier',
      description: 'Reality is always in flux.',
      image_url: FLUX_FLIER_ENTRY.newDisplayAsset.renderImages[0].image,
      rarity: 'rare',
      type: 'glider',
      vbucks_cost: 800,
      regular_price: 800,
      layout: 'Battle Ready',
      layout_rank: 184,
      sort_priority: -4,
      tile_size: '1x1',
      colors: {
        color1: '#290f07',
        color3: '#824100',
        text_background: '#824100',
      },
      bundle_items: [],
    });
  });

  it('uses the bundle name + image for bundle entries and preserves discount', () => {
    const result = mapShopEntry(ELITE_DAIGO_BUNDLE);

    expect(result?.name).toBe('Elite Daigo Bundle');
    expect(result?.image_url).toBe(ELITE_DAIGO_BUNDLE.bundle.image);
    expect(result?.vbucks_cost).toBe(1500);
    expect(result?.regular_price).toBe(2000);
    expect(result?.tile_size).toBe('2x1');
    expect(result?.type).toBe('bundle');
  });

  it('lifts the brItems list into bundle_items for bundle entries', () => {
    const entry = {
      ...ELITE_DAIGO_BUNDLE,
      brItems: [
        {
          id: 'CID_DAIGO',
          name: 'Elite Daigo',
          type: { value: 'outfit' },
          rarity: { value: 'epic' },
          images: { smallIcon: 'https://x/daigo-small.png' },
        },
        {
          id: 'PICKAXE_DAIGO',
          name: "Elite Hunter's Knife",
          type: { value: 'pickaxe' },
          rarity: { value: 'epic' },
          images: { icon: 'https://x/knife-icon.png' },
        },
      ],
    };

    const result = mapShopEntry(entry);

    expect(result?.bundle_items).toEqual([
      {
        id: 'CID_DAIGO',
        name: 'Elite Daigo',
        type: 'outfit',
        rarity: 'epic',
        image_url: 'https://x/daigo-small.png',
      },
      {
        id: 'PICKAXE_DAIGO',
        name: "Elite Hunter's Knife",
        type: 'pickaxe',
        rarity: 'epic',
        image_url: 'https://x/knife-icon.png',
      },
    ]);
  });

  it('skips bundle items missing an id or name without poisoning the list', () => {
    const entry = {
      ...ELITE_DAIGO_BUNDLE,
      brItems: [
        {
          id: 'CID_DAIGO',
          name: 'Elite Daigo',
          type: { value: 'outfit' },
          rarity: { value: 'epic' },
          images: { smallIcon: 'https://x/daigo.png' },
        },
        // missing id — must be dropped silently
        {
          name: 'Anonymous',
          type: { value: 'emote' },
          rarity: { value: 'rare' },
          images: { icon: 'https://x/emote.png' },
        },
        // missing name — must be dropped silently
        {
          id: 'GLIDER_X',
          type: { value: 'glider' },
          rarity: { value: 'epic' },
          images: { icon: 'https://x/glider.png' },
        },
      ],
    };

    const result = mapShopEntry(entry);

    expect(result?.bundle_items).toHaveLength(1);
    expect(result?.bundle_items[0].id).toBe('CID_DAIGO');
  });

  it('returns an empty bundle_items array for single-skin entries', () => {
    const result = mapShopEntry(FLUX_FLIER_ENTRY);
    expect(result?.bundle_items).toEqual([]);
  });

  it('classifies a single-skin entry by its first brItem type', () => {
    const result = mapShopEntry(RAVENPOOL_ENTRY);
    expect(result?.type).toBe('outfit');
  });

  it('falls back to "cosmetic" when type metadata is missing', () => {
    const entry = {
      ...FLUX_FLIER_ENTRY,
      brItems: [
        {
          id: 'X',
          name: 'X',
          rarity: { value: 'rare' },
          images: { icon: 'https://x/x.png' },
        },
      ],
    };
    expect(mapShopEntry(entry)?.type).toBe('cosmetic');
  });

  it('returns null for free entries (finalPrice <= 0)', () => {
    expect(mapShopEntry(FREE_ENTRY)).toBeNull();
  });

  it('returns null for non-cosmetic entries (jam tracks)', () => {
    expect(mapShopEntry(JAM_TRACK_ENTRY)).toBeNull();
  });

  it('returns null when no usable image can be resolved', () => {
    const entry = {
      ...FLUX_FLIER_ENTRY,
      newDisplayAsset: undefined,
      brItems: [
        {
          id: 'X',
          name: 'X',
          type: { value: 'outfit' },
          rarity: { value: 'rare' },
          images: {},
        },
      ],
    };
    expect(mapShopEntry(entry)).toBeNull();
  });

  // Real shop entries (notably bundles and some seasonal layouts) ship with no
  // `colors` block at all, or with `colors: null`. The mapper must always
  // return a fully-populated `colors` object so the UI can `entry.colors.color1`
  // without defensive guards everywhere.
  it('always returns a populated colors object even when the API omits it', () => {
    const noColors = { ...FLUX_FLIER_ENTRY, colors: undefined };
    const nullColors = { ...FLUX_FLIER_ENTRY, colors: null };
    const partialColors = {
      ...FLUX_FLIER_ENTRY,
      colors: { color1: 'aabbccff' }, // color3 + textBackgroundColor missing
    };

    for (const variant of [noColors, nullColors, partialColors]) {
      const result = mapShopEntry(variant);
      expect(result).not.toBeNull();
      expect(result?.colors).toBeDefined();
      expect(typeof result?.colors.color1).toBe('string');
      expect(typeof result?.colors.color3).toBe('string');
      expect(typeof result?.colors.text_background).toBe('string');
      // CSS-ready hex always starts with '#'
      expect(result?.colors.color1.startsWith('#')).toBe(true);
      expect(result?.colors.color3.startsWith('#')).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// fetchShopEntries — network behaviour
// ---------------------------------------------------------------------------

describe('services/skins — fetchShopEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns mapped entries on a successful API response', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        status: 200,
        data: {
          entries: [
            FLUX_FLIER_ENTRY,
            RAVENPOOL_ENTRY,
            JAM_TRACK_ENTRY,
            FREE_ENTRY,
            ELITE_DAIGO_BUNDLE,
          ],
        },
      }),
    });

    const entries = await fetchShopEntries();

    expect(entries.map((e: ShopEntry) => e.offerId)).toEqual([
      FLUX_FLIER_ENTRY.offerId,
      RAVENPOOL_ENTRY.offerId,
      ELITE_DAIGO_BUNDLE.offerId,
    ]);
  });

  it('returns an empty array (never throws) when the external API fails', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network down'),
    );

    await expect(fetchShopEntries()).resolves.toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// groupByLayout — sectioned catalog for the UI
// ---------------------------------------------------------------------------

describe('services/skins — groupByLayout', () => {
  const flux = mapShopEntry(FLUX_FLIER_ENTRY)!;
  const raven = mapShopEntry(RAVENPOOL_ENTRY)!;
  const daigo = mapShopEntry(ELITE_DAIGO_BUNDLE)!;

  it('groups entries by their layout name', () => {
    const sections = groupByLayout([flux, raven, daigo]);
    const names = sections.map((s: ShopSection) => s.layoutName);

    // 3 distinct layouts → 3 sections
    expect(names).toContain('Battle Ready');
    expect(names).toContain('Deadpool Mashups');
    expect(names).toContain('The Elites');
    expect(sections).toHaveLength(3);
  });

  it('sorts sections by API rank ascending (lower rank shows first)', () => {
    const sections = groupByLayout([raven, flux, daigo]);
    expect(sections.map((s: ShopSection) => s.layoutName)).toEqual([
      'The Elites',     // rank 100
      'Battle Ready',   // rank 184
      'Deadpool Mashups', // rank 189
    ]);
  });

  it('within a section, sorts entries by sort_priority ascending', () => {
    const a: ShopEntry = { ...flux, offerId: 'a', sort_priority: 5 };
    const b: ShopEntry = { ...flux, offerId: 'b', sort_priority: -10 };
    const c: ShopEntry = { ...flux, offerId: 'c', sort_priority: 0 };
    const sections = groupByLayout([a, b, c]);
    expect(sections[0].entries.map((e: ShopEntry) => e.offerId)).toEqual(['b', 'c', 'a']);
  });

  it('returns an empty array when given no entries', () => {
    expect(groupByLayout([])).toEqual([]);
  });

  it('groups entries without a layout name under a single "Други" bucket at the end', () => {
    const orphan: ShopEntry = {
      ...flux,
      offerId: 'orphan',
      layout: null,
      layout_rank: null,
    };
    const sections = groupByLayout([flux, orphan]);

    expect(sections.at(-1)?.layoutName).toBe('Други');
    expect(sections.at(-1)?.entries).toHaveLength(1);
  });
});
