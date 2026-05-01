import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

import { supabaseAdmin } from '@/lib/supabase/admin';
import { syncProfile } from '@/services/wallet';

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
});
