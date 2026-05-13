import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      getUserList: vi.fn().mockResolvedValue({ data: [] }),
    },
  }),
}));

import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  getRecentVBucksPurchasers,
  updateFriendRequestStatus,
} from '@/services/admin';

const mockFrom = vi.mocked(supabaseAdmin.from);

// Builds a chainable Supabase query mock that resolves at the terminal method.
const makePurchasesChain = (result: unknown) => ({
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockResolvedValue(result),
});

describe('services/admin — getRecentVBucksPurchasers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty data and zero total when there are no purchases', async () => {
    const purchasesChain = makePurchasesChain({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValueOnce(purchasesChain as never);

    const result = await getRecentVBucksPurchasers();

    expect(result).toEqual({ data: [], total: 0 });
  });

  it('returns mapped purchasers joined with profile data', async () => {
    const purchasesChain = makePurchasesChain({
      data: [
        {
          id: 'pur_1',
          user_id: 'user_abc',
          vbucks_amount: 1000,
          amount_cents: 799,
          created_at: '2026-05-01T10:00:00Z',
        },
      ],
      error: null,
      count: 1,
    });
    const profilesChain = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'user_abc',
            fortnite_username: 'NinjaPlayer',
            friend_request_status: 'pending',
            friend_request_accepted_at: null,
          },
        ],
        error: null,
      }),
    };

    mockFrom
      .mockReturnValueOnce(purchasesChain as never)
      .mockReturnValueOnce(profilesChain as never);

    const { data, total } = await getRecentVBucksPurchasers();

    expect(total).toBe(1);
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      purchase_id: 'pur_1',
      user_id: 'user_abc',
      fortnite_username: 'NinjaPlayer',
      vbucks_amount: 1000,
      friend_request_status: 'pending',
      friend_request_accepted_at: null,
    });
  });

  it('returns empty data when purchases fetch fails', async () => {
    const purchasesChain = makePurchasesChain({
      data: null,
      error: { message: 'db error' },
      count: null,
    });
    mockFrom.mockReturnValueOnce(purchasesChain as never);

    const result = await getRecentVBucksPurchasers();

    expect(result).toEqual({ data: [], total: 0 });
  });
});

describe('services/admin — updateFriendRequestStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates status without setting accepted_at for non-accepted states', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValueOnce(chain as never);

    await updateFriendRequestStatus('user_abc', 'pending');

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        friend_request_status: 'pending',
        friend_request_accepted_at: null,
      }),
    );
    expect(chain.eq).toHaveBeenCalledWith('id', 'user_abc');
  });

  it('sets friend_request_accepted_at when transitioning to accepted', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValueOnce(chain as never);

    await updateFriendRequestStatus('user_abc', 'accepted');

    const [updateArg] = chain.update.mock.calls[0];
    expect(updateArg.friend_request_status).toBe('accepted');
    expect(typeof updateArg.friend_request_accepted_at).toBe('string');
    expect(new Date(updateArg.friend_request_accepted_at).getFullYear()).toBe(
      new Date().getFullYear(),
    );
  });

  it('clears friend_request_accepted_at when transitioning away from accepted', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValueOnce(chain as never);

    await updateFriendRequestStatus('user_abc', 'not_sent');

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        friend_request_status: 'not_sent',
        friend_request_accepted_at: null,
      }),
    );
  });

  it('throws when the database returns an error', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: { message: 'update failed' } }),
    };
    mockFrom.mockReturnValueOnce(chain as never);

    await expect(
      updateFriendRequestStatus('user_abc', 'accepted'),
    ).rejects.toThrow('update failed');
  });
});
