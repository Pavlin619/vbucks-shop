import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => {
  const protect = vi.fn();
  const authFn = Object.assign(vi.fn(), { protect });
  return { auth: authFn };
});

vi.mock('@/services/admin', () => ({
  updateFriendRequestStatus: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { updateFriendRequestStatus } from '@/services/admin';
import { PATCH } from '@/app/api/admin/profiles/[userId]/friend-request/route';

const mockAuthProtect = vi.mocked(auth.protect);
const mockUpdateStatus = vi.mocked(updateFriendRequestStatus);

const adminClaims = { sessionClaims: { metadata: { role: 'admin' } } };
const userClaims = { sessionClaims: { metadata: {} } };

const makeRequest = (body: unknown, targetUserId = 'user_target') =>
  [
    new Request(`http://localhost:3000/api/admin/profiles/${targetUserId}/friend-request`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ userId: targetUserId }) },
  ] as const;

describe('PATCH /api/admin/profiles/[userId]/friend-request', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests via auth.protect', async () => {
    mockAuthProtect.mockRejectedValue(new Error('NEXT_NOT_FOUND'));

    const [req, ctx] = makeRequest({ status: 'pending' });
    await expect(PATCH(req, ctx)).rejects.toThrow();
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });

  it('returns 403 when the caller is not an admin', async () => {
    mockAuthProtect.mockResolvedValue(userClaims as never);

    const [req, ctx] = makeRequest({ status: 'pending' });
    const res = await PATCH(req, ctx);

    expect(res.status).toBe(403);
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid status value', async () => {
    mockAuthProtect.mockResolvedValue(adminClaims as never);

    const [req, ctx] = makeRequest({ status: 'invalid_status' });
    const res = await PATCH(req, ctx);

    expect(res.status).toBe(400);
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });

  it('returns 400 when the body is not valid JSON', async () => {
    mockAuthProtect.mockResolvedValue(adminClaims as never);

    const [req, ctx] = [
      new Request('http://localhost:3000/api/admin/profiles/user_target/friend-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      }),
      { params: Promise.resolve({ userId: 'user_target' }) },
    ] as const;

    const res = await PATCH(req, ctx);

    expect(res.status).toBe(400);
  });

  it('returns 404 when updateFriendRequestStatus throws (profile not found)', async () => {
    mockAuthProtect.mockResolvedValue(adminClaims as never);
    mockUpdateStatus.mockRejectedValue(new Error('Profile not found'));

    const [req, ctx] = makeRequest({ status: 'pending' });
    const res = await PATCH(req, ctx);

    expect(res.status).toBe(404);
  });

  it('returns 200 when status is updated successfully', async () => {
    mockAuthProtect.mockResolvedValue(adminClaims as never);
    mockUpdateStatus.mockResolvedValue(undefined);

    const [req, ctx] = makeRequest({ status: 'pending' });
    const res = await PATCH(req, ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    expect(mockUpdateStatus).toHaveBeenCalledWith('user_target', 'pending');
  });

  it('returns 200 and calls updateFriendRequestStatus with accepted', async () => {
    mockAuthProtect.mockResolvedValue(adminClaims as never);
    mockUpdateStatus.mockResolvedValue(undefined);

    const [req, ctx] = makeRequest({ status: 'accepted' });
    const res = await PATCH(req, ctx);

    expect(res.status).toBe(200);
    expect(mockUpdateStatus).toHaveBeenCalledWith('user_target', 'accepted');
  });

  it('accepts not_sent as a valid status', async () => {
    mockAuthProtect.mockResolvedValue(adminClaims as never);
    mockUpdateStatus.mockResolvedValue(undefined);

    const [req, ctx] = makeRequest({ status: 'not_sent' });
    const res = await PATCH(req, ctx);

    expect(res.status).toBe(200);
  });
});
