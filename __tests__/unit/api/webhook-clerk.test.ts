import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/webhooks', () => ({
  verifyWebhook: vi.fn(),
}));

vi.mock('@/services/wallet', () => ({
  syncProfile: vi.fn(),
}));

import { type NextRequest } from 'next/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { syncProfile } from '@/services/wallet';
import { POST } from '@/app/api/webhooks/clerk/route';

const mockVerifyWebhook = vi.mocked(verifyWebhook);
const mockSyncProfile = vi.mocked(syncProfile);

const makeRequest = (body = '{}') =>
  new Request('http://localhost:3000/api/webhooks/clerk', {
    method: 'POST',
    body,
  }) as unknown as NextRequest;

describe('POST /api/webhooks/clerk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSyncProfile.mockResolvedValue(undefined);
  });

  it('returns 400 when signature verification fails', async () => {
    mockVerifyWebhook.mockRejectedValue(new Error('Invalid signature'));

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    expect(mockSyncProfile).not.toHaveBeenCalled();
  });

  it('calls syncProfile with the user id and returns 200 on user.created', async () => {
    mockVerifyWebhook.mockResolvedValue({
      type: 'user.created',
      data: { id: 'user_abc123' },
    } as never);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockSyncProfile).toHaveBeenCalledOnce();
    expect(mockSyncProfile).toHaveBeenCalledWith('user_abc123');
  });

  it('returns 500 when syncProfile throws', async () => {
    mockVerifyWebhook.mockResolvedValue({
      type: 'user.created',
      data: { id: 'user_abc123' },
    } as never);
    mockSyncProfile.mockRejectedValue(new Error('DB connection lost'));

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
  });

  it('returns 200 without calling syncProfile for unhandled event types', async () => {
    mockVerifyWebhook.mockResolvedValue({
      type: 'user.deleted',
      data: { id: 'user_abc123' },
    } as never);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockSyncProfile).not.toHaveBeenCalled();
  });

  it('returns 200 without calling syncProfile for session events', async () => {
    mockVerifyWebhook.mockResolvedValue({
      type: 'session.created',
      data: { id: 'sess_xyz' },
    } as never);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockSyncProfile).not.toHaveBeenCalled();
  });

  it('does not call syncProfile on user.updated events', async () => {
    mockVerifyWebhook.mockResolvedValue({
      type: 'user.updated',
      data: { id: 'user_abc123' },
    } as never);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockSyncProfile).not.toHaveBeenCalled();
  });
});
