import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/services/skins', () => ({
  fetchShopEntries: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { fetchShopEntries } from '@/services/skins';
import { GET } from '@/app/api/skins/route';
import type { ShopEntry } from '@/types';

const mockAuth = vi.mocked(auth);
const mockFetchEntries = vi.mocked(fetchShopEntries);

const SAMPLE_ENTRIES: ShopEntry[] = [
  {
    offerId: 'v2:/abc',
    name: 'Flux Flier',
    description: 'Reality is always in flux.',
    image_url: 'https://x/flux.png',
    rarity: 'rare',
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
  },
];

describe('GET /api/skins', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null } as never);

    const res = await GET();

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(mockFetchEntries).not.toHaveBeenCalled();
  });

  it('returns 200 with the live shop entries for an authenticated user', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_abc' } as never);
    mockFetchEntries.mockResolvedValue(SAMPLE_ENTRIES);

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ entries: SAMPLE_ENTRIES });
  });

  it('returns 502 when the shop is empty (external API down + no cache)', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_abc' } as never);
    mockFetchEntries.mockResolvedValue([]);

    const res = await GET();

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body).toEqual({ error: 'Shop catalog unavailable' });
  });
});
