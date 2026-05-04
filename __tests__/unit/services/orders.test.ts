import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    rpc: vi.fn(),
  },
}));

vi.mock('@/services/wallet', () => ({
  getProfile: vi.fn(),
}));

vi.mock('@/services/skins', () => ({
  fetchShopEntries: vi.fn(),
}));

import { supabaseAdmin } from '@/lib/supabase/admin';
import { getProfile } from '@/services/wallet';
import { fetchShopEntries } from '@/services/skins';
import { createOrder } from '@/services/orders';
import type { Profile, ShopEntry } from '@/types';

const mockRpc = vi.mocked(supabaseAdmin.rpc);
const mockGetProfile = vi.mocked(getProfile);
const mockFetchEntries = vi.mocked(fetchShopEntries);

const RAVENPOOL_OFFER_ID =
  'v2:/664253e72bac6aa6df0d666893014d2a30e5f519ca2c5f2af5973f9222ef0d3f';

const RAVENPOOL_ENTRY: ShopEntry = {
  offerId: RAVENPOOL_OFFER_ID,
  name: 'Ravenpool',
  description: 'Maximum darkness.',
  image_url: 'https://x/raven.png',
  rarity: 'marvel',
  type: 'outfit',
  vbucks_cost: 1500,
  regular_price: 1500,
  layout: 'Deadpool Mashups',
  layout_rank: 189,
  sort_priority: -1,
  tile_size: '1x1',
  colors: {
    color1: '#274a59',
    color3: '#10171a',
    text_background: '#10171a',
  },
  bundle_items: [],
};

const profileWith = (overrides: Partial<Profile>): Profile => ({
  id: 'user_abc',
  fortnite_username: 'NinjaPlayer123',
  vbucks_balance: 5000,
  created_at: '2026-04-17T00:00:00Z',
  updated_at: '2026-04-17T00:00:00Z',
  ...overrides,
});

describe('services/orders — createOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns USERNAME_NOT_SET when fortnite_username is null', async () => {
    mockGetProfile.mockResolvedValue(profileWith({ fortnite_username: null }));
    mockFetchEntries.mockResolvedValue([RAVENPOOL_ENTRY]);

    const result = await createOrder('user_abc', RAVENPOOL_OFFER_ID);

    expect(result).toEqual({ ok: false, reason: 'USERNAME_NOT_SET' });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('returns USERNAME_NOT_SET when fortnite_username is whitespace only', async () => {
    mockGetProfile.mockResolvedValue(profileWith({ fortnite_username: '   ' }));
    mockFetchEntries.mockResolvedValue([RAVENPOOL_ENTRY]);

    const result = await createOrder('user_abc', RAVENPOOL_OFFER_ID);

    expect(result).toEqual({ ok: false, reason: 'USERNAME_NOT_SET' });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('returns SKIN_NOT_FOUND when the offerId is missing from the catalog', async () => {
    mockGetProfile.mockResolvedValue(profileWith({}));
    mockFetchEntries.mockResolvedValue([RAVENPOOL_ENTRY]);

    const result = await createOrder('user_abc', 'v2:/missing-offer');

    expect(result).toEqual({ ok: false, reason: 'SKIN_NOT_FOUND' });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('returns INSUFFICIENT_BALANCE when balance is below the skin cost', async () => {
    mockGetProfile.mockResolvedValue(profileWith({ vbucks_balance: 500 }));
    mockFetchEntries.mockResolvedValue([RAVENPOOL_ENTRY]);

    const result = await createOrder('user_abc', RAVENPOOL_OFFER_ID);

    expect(result).toEqual({
      ok: false,
      reason: 'INSUFFICIENT_BALANCE',
      balance: 500,
      cost: 1500,
    });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('calls buy_skin RPC and returns the new orderId on success', async () => {
    mockGetProfile.mockResolvedValue(profileWith({}));
    mockFetchEntries.mockResolvedValue([RAVENPOOL_ENTRY]);
    mockRpc.mockResolvedValue({
      data: '11111111-2222-3333-4444-555555555555',
      error: null,
    } as never);

    const result = await createOrder('user_abc', RAVENPOOL_OFFER_ID);

    expect(result).toEqual({
      ok: true,
      orderId: '11111111-2222-3333-4444-555555555555',
      skinName: 'Ravenpool',
      vbucksCost: 1500,
      remainingBalance: 3500,
    });
    expect(mockRpc).toHaveBeenCalledWith('buy_skin', {
      p_user_id: 'user_abc',
      p_skin_id: RAVENPOOL_OFFER_ID,
      p_skin_name: 'Ravenpool',
      p_vbucks_cost: 1500,
    });
  });

  it('returns INSUFFICIENT_BALANCE when the RPC raises a CHECK constraint violation', async () => {
    // Defence in depth: even if a concurrent debit drains the balance between
    // the pre-check and the RPC call, the database CHECK constraint refuses
    // the update. The service must translate that to the same status code.
    mockGetProfile.mockResolvedValue(profileWith({ vbucks_balance: 1500 }));
    mockFetchEntries.mockResolvedValue([RAVENPOOL_ENTRY]);
    mockRpc.mockResolvedValue({
      data: null,
      error: {
        code: '23514',
        message: 'new row for relation "profiles" violates check constraint',
      },
    } as never);

    const result = await createOrder('user_abc', RAVENPOOL_OFFER_ID);

    expect(result).toEqual({
      ok: false,
      reason: 'INSUFFICIENT_BALANCE',
      balance: 1500,
      cost: 1500,
    });
  });

  it('returns DB_ERROR when the RPC raises a non-balance error', async () => {
    mockGetProfile.mockResolvedValue(profileWith({}));
    mockFetchEntries.mockResolvedValue([RAVENPOOL_ENTRY]);
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: 'XX000', message: 'connection reset' },
    } as never);

    const result = await createOrder('user_abc', RAVENPOOL_OFFER_ID);

    expect(result).toEqual({ ok: false, reason: 'DB_ERROR' });
  });

  it('returns DB_ERROR when the RPC succeeds but returns no orderId', async () => {
    mockGetProfile.mockResolvedValue(profileWith({}));
    mockFetchEntries.mockResolvedValue([RAVENPOOL_ENTRY]);
    mockRpc.mockResolvedValue({ data: null, error: null } as never);

    const result = await createOrder('user_abc', RAVENPOOL_OFFER_ID);

    expect(result).toEqual({ ok: false, reason: 'DB_ERROR' });
  });
});
