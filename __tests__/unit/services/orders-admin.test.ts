import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      getUserList: vi.fn().mockResolvedValue({ data: [] }),
    },
  }),
}));

vi.mock('@/services/email', () => ({
  sendOrderFulfilledNotificationToAdmin: vi.fn().mockResolvedValue(undefined),
  sendOrderRefundedNotificationToAdmin: vi.fn().mockResolvedValue(undefined),
}));

import { supabaseAdmin } from '@/lib/supabase/admin';
import { getPendingOrders, fulfillOrder } from '@/services/orders';
import {
  sendOrderFulfilledNotificationToAdmin,
  sendOrderRefundedNotificationToAdmin,
} from '@/services/email';

const mockFrom = vi.mocked(supabaseAdmin.from);
const mockRpc = vi.mocked(supabaseAdmin.rpc);
const mockFulfilledEmail = vi.mocked(sendOrderFulfilledNotificationToAdmin);
const mockRefundedEmail = vi.mocked(sendOrderRefundedNotificationToAdmin);

// Chainable Supabase mock helpers
const makeSelectChain = (terminal: string, result: unknown) => {
  const chain: Record<string, unknown> = {};
  ['select', 'eq', 'order', 'in', 'single'].forEach((method) => {
    chain[method] = vi.fn().mockReturnThis();
  });
  (chain[terminal] as ReturnType<typeof vi.fn>).mockResolvedValue(result);
  return chain;
};

// --- getPendingOrders ---

describe('services/orders — getPendingOrders', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty array when there are no pending orders', async () => {
    const ordersChain = makeSelectChain('order', { data: [], error: null });
    mockFrom.mockReturnValueOnce(ordersChain as never);

    const result = await getPendingOrders();

    expect(result.dbError).toBe(false);
    expect(result.data).toEqual([]);
  });

  it('joins pending orders with fortnite_username from profiles', async () => {
    const ordersChain = makeSelectChain('order', {
      data: [
        {
          id: 'order_1',
          user_id: 'user_abc',
          skin_id: 'v2:/abc',
          skin_name: 'Ravenpool',
          vbucks_cost: 1500,
          status: 'pending',
          created_at: '2026-05-01T10:00:00Z',
          resolved_at: null,
        },
      ],
      error: null,
    });
    const profilesChain = makeSelectChain('in', {
      data: [{ id: 'user_abc', fortnite_username: 'NinjaPlayer99' }],
      error: null,
    });

    mockFrom
      .mockReturnValueOnce(ordersChain as never)
      .mockReturnValueOnce(profilesChain as never);

    const result = await getPendingOrders();

    expect(result.dbError).toBe(false);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: 'order_1',
      skin_name: 'Ravenpool',
      status: 'pending',
      fortnite_username: 'NinjaPlayer99',
    });
  });

  it('uses null for fortnite_username when profile is missing', async () => {
    const ordersChain = makeSelectChain('order', {
      data: [
        {
          id: 'order_2',
          user_id: 'user_xyz',
          skin_id: 'v2:/xyz',
          skin_name: 'Bandolier',
          vbucks_cost: 1200,
          status: 'pending',
          created_at: '2026-05-02T09:00:00Z',
          resolved_at: null,
        },
      ],
      error: null,
    });
    const profilesChain = makeSelectChain('in', { data: [], error: null });

    mockFrom
      .mockReturnValueOnce(ordersChain as never)
      .mockReturnValueOnce(profilesChain as never);

    const result = await getPendingOrders();

    expect(result.data[0].fortnite_username).toBeNull();
  });

  it('returns empty array and logs error on DB failure', async () => {
    const ordersChain = makeSelectChain('order', {
      data: null,
      error: { message: 'DB error' },
    });
    mockFrom.mockReturnValueOnce(ordersChain as never);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getPendingOrders();

    expect(result.dbError).toBe(true);
    expect(result.data).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// --- fulfillOrder ---

describe('services/orders — fulfillOrder', () => {
  beforeEach(() => vi.clearAllMocks());

  function makeFetchOrderChain(order: unknown | null, fetchError: unknown = null) {
    const chain: Record<string, unknown> = {};
    ['select', 'eq'].forEach((m) => {
      chain[m] = vi.fn().mockReturnThis();
    });
    chain['single'] = vi.fn().mockResolvedValue({ data: order, error: fetchError });
    return chain;
  }

  function makeUpdateChain(result: unknown) {
    const chain: Record<string, unknown> = {};
    ['update', 'eq'].forEach((m) => {
      chain[m] = vi.fn().mockReturnThis();
    });
    chain['eq'] = vi.fn().mockResolvedValue(result);
    return chain;
  }

  function makeProfileChain(profile: unknown) {
    const chain: Record<string, unknown> = {};
    ['select', 'eq'].forEach((m) => {
      chain[m] = vi.fn().mockReturnThis();
    });
    chain['single'] = vi.fn().mockResolvedValue({ data: profile, error: null });
    return chain;
  }

  it('throws "Order not found" when the order does not exist', async () => {
    const fetchChain = makeFetchOrderChain(null, { message: 'not found' });
    mockFrom.mockReturnValueOnce(fetchChain as never);

    await expect(fulfillOrder('bad_id', 'gifted')).rejects.toThrow('Order not found');
  });

  it('throws "Order is not pending" when order is already gifted', async () => {
    const order = {
      id: 'order_1',
      status: 'gifted',
      user_id: 'user_abc',
      vbucks_cost: 1500,
      skin_name: 'Ravenpool',
    };
    const fetchChain = makeFetchOrderChain(order);
    mockFrom.mockReturnValueOnce(fetchChain as never);

    await expect(fulfillOrder('order_1', 'gifted')).rejects.toThrow(
      'Order is not pending',
    );
  });

  it('marks order as gifted and fires admin email', async () => {
    vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');

    const order = {
      id: 'order_1',
      status: 'pending',
      user_id: 'user_abc',
      vbucks_cost: 1500,
      skin_name: 'Ravenpool',
    };
    const fetchChain = makeFetchOrderChain(order);
    const updateChain = makeUpdateChain({ error: null });
    const profileChain = makeProfileChain({ fortnite_username: 'NinjaPlayer99' });

    mockFrom
      .mockReturnValueOnce(fetchChain as never)
      .mockReturnValueOnce(updateChain as never)
      .mockReturnValueOnce(profileChain as never);

    await fulfillOrder('order_1', 'gifted');

    // Allow fire-and-forget email to settle
    await new Promise((r) => setTimeout(r, 0));

    expect(mockFulfilledEmail).toHaveBeenCalledWith(
      ['admin@example.com'],
      'NinjaPlayer99',
      'Ravenpool',
    );
    expect(mockRefundedEmail).not.toHaveBeenCalled();

    vi.unstubAllEnvs();
  });

  it('refunds order via RPC and fires refund admin email', async () => {
    vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');

    const order = {
      id: 'order_1',
      status: 'pending',
      user_id: 'user_abc',
      vbucks_cost: 1500,
      skin_name: 'Ravenpool',
    };
    const fetchChain = makeFetchOrderChain(order);
    const profileChain = makeProfileChain({ fortnite_username: 'NinjaPlayer99' });

    mockFrom
      .mockReturnValueOnce(fetchChain as never)
      .mockReturnValueOnce(profileChain as never);
    mockRpc.mockResolvedValue({ error: null } as never);

    await fulfillOrder('order_1', 'refunded');
    await new Promise((r) => setTimeout(r, 0));

    expect(mockRpc).toHaveBeenCalledWith('refund_order', { p_order_id: 'order_1' });
    expect(mockRefundedEmail).toHaveBeenCalledWith(
      ['admin@example.com'],
      'NinjaPlayer99',
      'Ravenpool',
      1500,
    );
    expect(mockFulfilledEmail).not.toHaveBeenCalled();

    vi.unstubAllEnvs();
  });

  it('throws when the DB update fails for a gifted action', async () => {
    const order = {
      id: 'order_1',
      status: 'pending',
      user_id: 'user_abc',
      vbucks_cost: 1500,
      skin_name: 'Ravenpool',
    };
    const fetchChain = makeFetchOrderChain(order);
    const updateChain = makeUpdateChain({ error: { message: 'DB write failed' } });

    mockFrom
      .mockReturnValueOnce(fetchChain as never)
      .mockReturnValueOnce(updateChain as never);

    await expect(fulfillOrder('order_1', 'gifted')).rejects.toThrow('DB write failed');
  });
});
