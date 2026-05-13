import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckout } from '@/app/(shop)/cart/_lib/use-checkout';

describe('useCheckout — error mapping', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Reflect.deleteProperty(window, 'location');
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...originalLocation, pathname: '/cart', href: '/' },
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

  function mockFetch(status: number, body: unknown) {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(body), { status }),
    );
  }

  it('maps 422 to no_username', async () => {
    mockFetch(422, { error: 'fortnite_username_required' });
    const { result } = renderHook(() => useCheckout([{ packId: '1000', quantity: 1 }]));
    await act(async () => {
      await result.current.checkout();
    });
    expect(result.current.error?.kind).toBe('no_username');
  });

  it('maps 400 to invalid_cart', async () => {
    mockFetch(400, { error: 'Invalid packId: bogus' });
    const { result } = renderHook(() => useCheckout([{ packId: 'bogus', quantity: 1 }]));
    await act(async () => {
      await result.current.checkout();
    });
    expect(result.current.error).toEqual({
      kind: 'invalid_cart',
      message: 'Invalid packId: bogus',
    });
  });

  it('maps 500 to transient', async () => {
    mockFetch(500, { error: 'Payment service unavailable' });
    const { result } = renderHook(() => useCheckout([{ packId: '1000', quantity: 1 }]));
    await act(async () => {
      await result.current.checkout();
    });
    expect(result.current.error?.kind).toBe('transient');
  });
});
