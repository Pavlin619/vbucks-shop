import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => {
  const protect = vi.fn();
  const authFn = Object.assign(vi.fn(), { protect });
  return { auth: authFn };
});

vi.mock('@/services/skins', () => ({
  fetchShopEntries: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { fetchShopEntries } from '@/services/skins';
import { GET } from '@/app/api/skins/route';
import type { ShopEntry } from '@/types';

const mockAuthProtect = vi.mocked(auth.protect);
const mockFetchEntries = vi.mocked(fetchShopEntries);

const SAMPLE_ENTRIES: ShopEntry[] = [
  {
    offerId: 'v2:/abc',
    name: 'Flux Flier',
    description: 'Reality is always in flux.',
    image_url: 'https://x/flux.png',
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
  },
];

describe('GET /api/skins', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests via auth.protect (defence-in-depth)', async () => {
    // Middleware is the primary auth gate; auth.protect() in the route
    // is the defensive fallback. When unauth'd, Clerk's auth.protect()
    // throws (Next renders 404 / NEXT_NOT_FOUND).
    mockAuthProtect.mockRejectedValue(new Error('NEXT_NOT_FOUND'));

    await expect(GET()).rejects.toThrow();
    expect(mockAuthProtect).toHaveBeenCalled();
    expect(mockFetchEntries).not.toHaveBeenCalled();
  });

  it('returns 200 with the live shop entries for an authenticated user', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockFetchEntries.mockResolvedValue(SAMPLE_ENTRIES);

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ entries: SAMPLE_ENTRIES });
  });

  it('returns 502 when the shop is empty (external API down + no cache)', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockFetchEntries.mockResolvedValue([]);

    const res = await GET();

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body).toEqual({ error: 'Shop catalog unavailable' });
  });
});
