import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiFetch, ApiError } from '@/lib/api-client';

describe('apiFetch', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Replace `window.location` so the 401-redirect branch is observable.
    Reflect.deleteProperty(window, 'location');
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...originalLocation, href: 'http://localhost/', pathname: '/cart' },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  it('returns the parsed body for a 2xx response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, value: 42 }), { status: 200 }),
    );
    const data = await apiFetch<{ ok: boolean; value: number }>('/api/x');
    expect(data).toEqual({ ok: true, value: 42 });
  });

  it('throws ApiError with status + body for non-2xx', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Insufficient', balance: 100, cost: 500 }), {
        status: 409,
      }),
    );
    try {
      await apiFetch('/api/orders', { method: 'POST' });
      throw new Error('expected ApiError');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      const err = e as ApiError;
      expect(err.status).toBe(409);
      expect(err.body).toEqual({ error: 'Insufficient', balance: 100, cost: 500 });
      expect(err.message).toBe('Insufficient');
    }
  });

  it('redirects to /sign-in on 401 with the current pathname', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    // The function never resolves on the client (navigation replaces the page),
    // so race it against a microtask-driven timeout.
    const settle = Promise.race([
      apiFetch('/api/checkout', { method: 'POST' }).then(() => 'resolved'),
      new Promise((r) => setTimeout(() => r('pending'), 10)),
    ]);
    const outcome = await settle;
    expect(outcome).toBe('pending');
    expect(window.location.href).toBe('/sign-in?redirect_url=%2Fcart');
  });

  it('respects an explicit signInRedirectTo', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    await Promise.race([
      apiFetch('/api/x', { signInRedirectTo: '/item-shop/abc' }),
      new Promise((r) => setTimeout(r, 10)),
    ]);
    expect(window.location.href).toBe('/sign-in?redirect_url=%2Fitem-shop%2Fabc');
  });

  it('safely handles a non-JSON 500 body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('<html>nope</html>', { status: 500 }),
    );
    try {
      await apiFetch('/api/x');
      throw new Error('expected ApiError');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      const err = e as ApiError;
      expect(err.status).toBe(500);
      expect(err.body).toEqual({});
      expect(err.message).toBe('Request failed (500)');
    }
  });
});
