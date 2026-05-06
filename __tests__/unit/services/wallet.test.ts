import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

import { supabaseAdmin } from '@/lib/supabase/admin';
import { syncProfile, getProfile } from '@/services/wallet';

const mockFrom = vi.mocked(supabaseAdmin.from);

describe('services/wallet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('syncProfile', () => {
    it('upserts the profile row without error', async () => {
      mockFrom.mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      } as never);

      await expect(syncProfile('user_123')).resolves.toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith('profiles');
    });

    it('throws when the database returns an error', async () => {
      mockFrom.mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: { message: 'upsert failed' } }),
      } as never);

      await expect(syncProfile('user_123')).rejects.toThrow('upsert failed');
    });
  });

  describe('getProfile', () => {
    const mockProfile = {
      id: 'user_123',
      fortnite_username: 'NinjaPlayer',
      vbucks_balance: 500,
      friend_request_status: 'accepted',
      friend_request_accepted_at: '2026-04-17T00:00:00Z',
      created_at: '2026-04-17T00:00:00Z',
      updated_at: '2026-04-17T00:00:00Z',
    };

    it('returns the profile row when it exists', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
      } as never);

      const result = await getProfile('user_123');

      expect(result).toEqual(mockProfile);
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      // getProfile is a pure read — it must not call upsert
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });

    it('throws when the profile row does not exist', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'No rows found' },
            }),
          }),
        }),
      } as never);

      await expect(getProfile('user_unknown')).rejects.toThrow('No rows found');
    });

    it('does not call upsert (syncProfile) as a side effect', async () => {
      const mockUpsert = vi.fn();
      mockFrom.mockReturnValue({
        upsert: mockUpsert,
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
      } as never);

      await getProfile('user_123');

      expect(mockUpsert).not.toHaveBeenCalled();
    });
  });
});
