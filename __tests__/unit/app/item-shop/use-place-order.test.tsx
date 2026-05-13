import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePlaceOrder } from '@/app/(shop)/item-shop/[offerId]/_lib/use-place-order';

describe('usePlaceOrder — error mapping', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Reflect.deleteProperty(window, 'location');
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...originalLocation, pathname: '/item-shop/abc', href: '/' },
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
    mockFetch(422, { error: 'Fortnite username not set' });
    const { result } = renderHook(() => usePlaceOrder('skin-1'));
    await act(async () => {
      await result.current.placeOrder();
    });
    expect(result.current.error).toEqual({
      kind: 'no_username',
      message: 'Fortnite username not set',
    });
  });

  it('maps 403 to forbidden', async () => {
    mockFetch(403, { error: 'Item Shop access requirements not met' });
    const { result } = renderHook(() => usePlaceOrder('skin-1'));
    await act(async () => {
      await result.current.placeOrder();
    });
    expect(result.current.error?.kind).toBe('forbidden');
  });

  it('maps 404 to shop_rotated', async () => {
    mockFetch(404, { error: 'Skin not found in catalog' });
    const { result } = renderHook(() => usePlaceOrder('skin-1'));
    await act(async () => {
      await result.current.placeOrder();
    });
    expect(result.current.error?.kind).toBe('shop_rotated');
  });

  it('maps 409 to insufficient with balance + cost', async () => {
    mockFetch(409, { error: 'Insufficient V-Bucks balance', balance: 100, cost: 500 });
    const { result } = renderHook(() => usePlaceOrder('skin-1'));
    await act(async () => {
      await result.current.placeOrder();
    });
    expect(result.current.error).toEqual({
      kind: 'insufficient',
      message: 'Insufficient V-Bucks balance',
      balance: 100,
      cost: 500,
    });
  });

  it('maps 500 to transient', async () => {
    mockFetch(500, { error: 'Order placement failed' });
    const { result } = renderHook(() => usePlaceOrder('skin-1'));
    await act(async () => {
      await result.current.placeOrder();
    });
    expect(result.current.error?.kind).toBe('transient');
  });

  it('exposes success body on 201', async () => {
    mockFetch(201, {
      orderId: 'order-1',
      skinName: 'Reaper',
      vbucksCost: 1500,
      remainingBalance: 500,
    });
    const { result } = renderHook(() => usePlaceOrder('skin-1'));
    await act(async () => {
      await result.current.placeOrder();
    });
    expect(result.current.success).toEqual({
      orderId: 'order-1',
      skinName: 'Reaper',
      vbucksCost: 1500,
      remainingBalance: 500,
    });
    expect(result.current.error).toBeNull();
  });

  it('reset clears error and success', async () => {
    mockFetch(409, { error: 'x', balance: 0, cost: 100 });
    const { result } = renderHook(() => usePlaceOrder('skin-1'));
    await act(async () => {
      await result.current.placeOrder();
    });
    expect(result.current.error).not.toBeNull();
    act(() => result.current.reset());
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBeNull();
  });

  it('toggles loading around the request', async () => {
    mockFetch(500, { error: 'x' });
    const { result } = renderHook(() => usePlaceOrder('skin-1'));
    expect(result.current.loading).toBe(false);
    const pending = act(async () => {
      await result.current.placeOrder();
    });
    await pending;
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
