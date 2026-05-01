import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('@/services/wallet', () => ({
  syncProfile: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { syncProfile } from '@/services/wallet';
import { headers } from 'next/headers';
import { POST } from '@/app/api/webhooks/stripe/route';

const mockConstructEvent = vi.mocked(stripe.webhooks.constructEvent);
const mockHeaders = vi.mocked(headers);
const mockFrom = vi.mocked(supabaseAdmin.from);
const mockRpc = vi.mocked(supabaseAdmin.rpc);
const mockSyncProfile = vi.mocked(syncProfile);

const VALID_SIG = 't=123,v1=abc';

const SESSION_COMPLETED_EVENT = {
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_abc123',
      metadata: { userId: 'user_xyz', vbucks: '1500' },
      amount_total: 798,
    },
  },
};

const makeRequest = (body = '{"test":true}', sig = VALID_SIG) => {
  mockHeaders.mockResolvedValue({
    get: vi.fn().mockReturnValue(sig),
  } as never);
  return new Request('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    body,
  });
};

const mockSuccessfulDb = () => {
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
    insert: vi.fn().mockResolvedValue({ error: null }),
  } as never);
  mockRpc.mockResolvedValue({ error: null } as never);
  mockSyncProfile.mockResolvedValue(undefined);
};

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  });

  it('returns 400 when stripe-signature header is missing', async () => {
    mockHeaders.mockResolvedValue({
      get: vi.fn().mockReturnValue(null),
    } as never);

    const req = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: 'payload',
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
  });

  it('returns 200 and credits wallet on first valid event', async () => {
    mockConstructEvent.mockReturnValue(SESSION_COMPLETED_EVENT as never);
    mockSuccessfulDb();

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ received: true });
    expect(mockSyncProfile).toHaveBeenCalledWith('user_xyz');
    expect(mockRpc).toHaveBeenCalledWith('increment_vbucks', {
      p_user_id: 'user_xyz',
      p_amount: 1500,
    });
  });

  it('returns 200 even when packId is absent (cart flow has no single packId)', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_no_packid',
          metadata: { userId: 'user_xyz', vbucks: '500' }, // no packId
          amount_total: 299,
        },
      },
    } as never);
    mockSuccessfulDb();

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith('increment_vbucks', {
      p_user_id: 'user_xyz',
      p_amount: 500,
    });
  });

  it('returns 200 (no-op) when userId or vbucks metadata is missing', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_bad_metadata',
          metadata: {}, // missing userId and vbucks
          amount_total: 299,
        },
      },
    } as never);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockSyncProfile).not.toHaveBeenCalled();
  });

  it('returns 200 and skips processing on duplicate event (idempotent)', async () => {
    mockConstructEvent.mockReturnValue(SESSION_COMPLETED_EVENT as never);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing' }, error: null }),
        }),
      }),
    } as never);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockSyncProfile).not.toHaveBeenCalled();
  });

  it('returns 500 when syncProfile throws', async () => {
    mockConstructEvent.mockReturnValue(SESSION_COMPLETED_EVENT as never);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    } as never);
    mockSyncProfile.mockRejectedValue(new Error('upsert failed'));

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
  });

  it('returns 500 when DB insert fails (Stripe will retry)', async () => {
    mockConstructEvent.mockReturnValue(SESSION_COMPLETED_EVENT as never);
    mockSyncProfile.mockResolvedValue(undefined);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: { message: 'insert failed' } }),
    } as never);

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
  });

  it('returns 200 for unhandled event types', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.created',
      data: { object: {} },
    } as never);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
