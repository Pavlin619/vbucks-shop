import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => {
  const protect = vi.fn();
  const authFn = Object.assign(vi.fn(), { protect });
  return { auth: authFn };
});

vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        retrieve: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { GET } from '@/app/api/checkout/verify/route';

const mockAuthProtect = vi.mocked(auth.protect);
const mockRetrieve = vi.mocked(stripe.checkout.sessions.retrieve);
const mockFrom = vi.mocked(supabaseAdmin.from);

const USER_ID = 'user_abc';
const SESSION_ID = 'cs_test_123';

function makeRequest(sessionId?: string) {
  const url = sessionId
    ? `http://localhost/api/checkout/verify?session_id=${sessionId}`
    : 'http://localhost/api/checkout/verify';
  return new Request(url);
}

function mockPurchasesQuery(data: { id: string } | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  mockFrom.mockReturnValue({ select } as never);
}

describe('GET /api/checkout/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthProtect.mockResolvedValue({ userId: USER_ID } as never);
  });

  it('returns 400 when session_id is missing', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.paid).toBe(false);
  });

  it('returns 403 when session belongs to a different user', async () => {
    mockRetrieve.mockResolvedValue({
      client_reference_id: 'other_user',
      payment_status: 'paid',
    } as never);

    const res = await GET(makeRequest(SESSION_ID));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.paid).toBe(false);
  });

  it('returns paid:false when Stripe payment_status is not paid', async () => {
    mockRetrieve.mockResolvedValue({
      client_reference_id: USER_ID,
      payment_status: 'unpaid',
    } as never);

    const res = await GET(makeRequest(SESSION_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ paid: false });
  });

  it('returns paid:true when Stripe says paid and purchases row exists', async () => {
    mockRetrieve.mockResolvedValue({
      client_reference_id: USER_ID,
      payment_status: 'paid',
    } as never);
    mockPurchasesQuery({ id: 'purchase_uuid' });

    const res = await GET(makeRequest(SESSION_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ paid: true });
  });

  it('returns paid:false pending:true when Stripe paid but webhook not yet processed', async () => {
    mockRetrieve.mockResolvedValue({
      client_reference_id: USER_ID,
      payment_status: 'paid',
    } as never);
    mockPurchasesQuery(null);

    const res = await GET(makeRequest(SESSION_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ paid: false, pending: true });
  });

  it('returns 400 when Stripe throws', async () => {
    mockRetrieve.mockRejectedValue(new Error('Stripe error'));

    const res = await GET(makeRequest(SESSION_ID));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.paid).toBe(false);
  });
});
