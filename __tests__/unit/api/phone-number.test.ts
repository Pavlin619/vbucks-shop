import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => {
  const protect = vi.fn();
  const authFn = Object.assign(vi.fn(), { protect });
  const clerkClientMock = vi.fn().mockResolvedValue({
    users: { updateUserMetadata: vi.fn().mockResolvedValue({}) },
  });
  return { auth: authFn, clerkClient: clerkClientMock };
});

vi.mock('@/services/wallet', () => ({
  savePhoneNumber: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { savePhoneNumber } from '@/services/wallet';
import { PUT } from '@/app/api/profile/phone-number/route';

const mockAuthProtect = vi.mocked(auth.protect);
const mockSavePhoneNumber = vi.mocked(savePhoneNumber);

const makeRequest = (body: unknown) =>
  new Request('http://localhost:3000/api/profile/phone-number', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('PUT /api/profile/phone-number', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthProtect.mockResolvedValue({ userId: 'user_abc' } as never);
    mockSavePhoneNumber.mockResolvedValue(undefined);
  });

  it('rejects unauthenticated requests via auth.protect', async () => {
    mockAuthProtect.mockRejectedValue(new Error('NEXT_NOT_FOUND'));

    await expect(PUT(makeRequest({ phone_number: '+359881234567' }))).rejects.toThrow();
    expect(mockSavePhoneNumber).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON body', async () => {
    const res = await PUT(
      new Request('http://localhost:3000/api/profile/phone-number', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      }),
    );
    expect(res.status).toBe(400);
    expect(mockSavePhoneNumber).not.toHaveBeenCalled();
  });

  it('returns 400 when phone_number is missing', async () => {
    const res = await PUT(makeRequest({}));
    expect(res.status).toBe(400);
    expect(mockSavePhoneNumber).not.toHaveBeenCalled();
  });

  it('returns 400 when phone_number is blank whitespace', async () => {
    const res = await PUT(makeRequest({ phone_number: '   ' }));
    expect(res.status).toBe(400);
    expect(mockSavePhoneNumber).not.toHaveBeenCalled();
  });

  it('returns 400 when phone_number is not a string', async () => {
    const res = await PUT(makeRequest({ phone_number: 12345678 }));
    expect(res.status).toBe(400);
    expect(mockSavePhoneNumber).not.toHaveBeenCalled();
  });

  it('returns 400 when phone has fewer than 7 digits', async () => {
    const res = await PUT(makeRequest({ phone_number: '12345' }));
    expect(res.status).toBe(400);
    expect(mockSavePhoneNumber).not.toHaveBeenCalled();
  });

  it('saves a valid phone number and returns 200', async () => {
    const res = await PUT(makeRequest({ phone_number: '+359 88 123 4567' }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    expect(mockSavePhoneNumber).toHaveBeenCalledWith('user_abc', '+359 88 123 4567');
  });

  it('accepts plain digits without country code', async () => {
    const res = await PUT(makeRequest({ phone_number: '0881234567' }));

    expect(res.status).toBe(200);
    expect(mockSavePhoneNumber).toHaveBeenCalledWith('user_abc', '0881234567');
  });
});
