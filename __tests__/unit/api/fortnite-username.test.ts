import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => {
  const protect = vi.fn();
  const authFn = Object.assign(vi.fn(), { protect });
  return { auth: authFn };
});

vi.mock('@/services/wallet', () => ({
  updateFortniteUsername: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { updateFortniteUsername } from '@/services/wallet';
import { PUT } from '@/app/api/profile/fortnite-username/route';

const mockAuthProtect = vi.mocked(auth.protect);
const mockUpdateFortniteUsername = vi.mocked(updateFortniteUsername);

const makeRequest = (body: unknown) =>
  new Request('http://localhost:3000/api/profile/fortnite-username', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('PUT /api/profile/fortnite-username', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
  });

  it('rejects unauthenticated requests via auth.protect', async () => {
    mockAuthProtect.mockRejectedValue(new Error('NEXT_NOT_FOUND'));

    await expect(PUT(makeRequest({ fortnite_username: 'Ninja' }))).rejects.toThrow();
    expect(mockUpdateFortniteUsername).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON body', async () => {
    const res = await PUT(
      new Request('http://localhost:3000/api/profile/fortnite-username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      }),
    );
    expect(res.status).toBe(400);
    expect(mockUpdateFortniteUsername).not.toHaveBeenCalled();
  });

  it('returns 400 when fortnite_username is missing', async () => {
    const res = await PUT(makeRequest({}));
    expect(res.status).toBe(400);
    expect(mockUpdateFortniteUsername).not.toHaveBeenCalled();
  });

  it('returns 400 when fortnite_username is blank whitespace', async () => {
    const res = await PUT(makeRequest({ fortnite_username: '   ' }));
    expect(res.status).toBe(400);
    expect(mockUpdateFortniteUsername).not.toHaveBeenCalled();
  });

  it('returns 400 when fortnite_username is not a string', async () => {
    const res = await PUT(makeRequest({ fortnite_username: 42 }));
    expect(res.status).toBe(400);
    expect(mockUpdateFortniteUsername).not.toHaveBeenCalled();
  });

  it('saves the trimmed username and returns 200', async () => {
    mockUpdateFortniteUsername.mockResolvedValue(undefined);

    const res = await PUT(makeRequest({ fortnite_username: '  NinjaPlayer  ' }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    expect(mockUpdateFortniteUsername).toHaveBeenCalledWith('user_abc', 'NinjaPlayer');
  });
});
