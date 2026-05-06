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
    rpc: vi.fn(),
  },
}));

vi.mock('@/services/wallet', () => ({
  getProfile: vi.fn(),
}));

vi.mock('@/services/email', () => ({
  sendVBucksPurchaseNotificationToAdmin: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getProfile } from '@/services/wallet';
import { sendVBucksPurchaseNotificationToAdmin } from '@/services/email';
import { headers } from 'next/headers';
import { POST } from '@/app/api/webhooks/stripe/route';

const mockConstructEvent = vi.mocked(stripe.webhooks.constructEvent);
const mockHeaders = vi.mocked(headers);
const mockRpc = vi.mocked(supabaseAdmin.rpc);
const mockGetProfile = vi.mocked(getProfile);
const mockSendAdminEmail = vi.mocked(sendVBucksPurchaseNotificationToAdmin);

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

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.ADMIN_EMAILS = '';
    mockGetProfile.mockResolvedValue({
      id: 'user_xyz',
      fortnite_username: 'NinjaPlayer',
      vbucks_balance: 1000,
      friend_request_status: 'accepted',
      friend_request_accepted_at: '2026-04-17T00:00:00Z',
      created_at: '2026-04-17T00:00:00Z',
      updated_at: '2026-04-17T00:00:00Z',
    });
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
    mockRpc.mockResolvedValue({ data: 'credited', error: null } as never);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ received: true });
    expect(mockRpc).toHaveBeenCalledWith('credit_purchase', {
      p_user_id: 'user_xyz',
      p_session_id: 'cs_test_abc123',
      p_vbucks: 1500,
      p_amount_cents: 798,
    });
  });

  it('returns 200 even when packId is absent (cart flow has no single packId)', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_no_packid',
          metadata: { userId: 'user_xyz', vbucks: '500' },
          amount_total: 299,
        },
      },
    } as never);
    mockRpc.mockResolvedValue({ data: 'credited', error: null } as never);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith('credit_purchase', {
      p_user_id: 'user_xyz',
      p_session_id: 'cs_test_no_packid',
      p_vbucks: 500,
      p_amount_cents: 299,
    });
  });

  it('returns 200 (no-op) when userId or vbucks metadata is missing', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_bad_metadata',
          metadata: {},
          amount_total: 299,
        },
      },
    } as never);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('returns 200 (no-op) when vbucks metadata is not a positive integer', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_nan_vbucks',
          metadata: { userId: 'user_xyz', vbucks: 'not-a-number' },
          amount_total: 299,
        },
      },
    } as never);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('returns 200 and skips processing on duplicate event (RPC reports duplicate)', async () => {
    mockConstructEvent.mockReturnValue(SESSION_COMPLETED_EVENT as never);
    mockRpc.mockResolvedValue({ data: 'duplicate', error: null } as never);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when credit_purchase RPC fails (Stripe will retry)', async () => {
    mockConstructEvent.mockReturnValue(SESSION_COMPLETED_EVENT as never);
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'rpc failed' },
    } as never);

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
  });

  it('returns 500 when credit_purchase returns an unexpected value', async () => {
    mockConstructEvent.mockReturnValue(SESSION_COMPLETED_EVENT as never);
    mockRpc.mockResolvedValue({ data: 'something-else', error: null } as never);

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
