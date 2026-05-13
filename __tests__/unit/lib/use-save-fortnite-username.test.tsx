import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
}));

import { useSaveFortniteUsername } from '@/lib/hooks/use-save-fortnite-username';

describe('useSaveFortniteUsername', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    refresh.mockClear();
    Reflect.deleteProperty(window, 'location');
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...originalLocation, pathname: '/profile', href: '/' },
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

  it('calls router.refresh on a successful save', async () => {
    mockFetch(200, { ok: true });
    const { result } = renderHook(() => useSaveFortniteUsername());
    await act(async () => {
      await result.current.saveUsername('NinjaPlayer');
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  it('exposes the backend error message on a 400', async () => {
    mockFetch(400, { error: 'Invalid format' });
    const { result } = renderHook(() => useSaveFortniteUsername());
    await act(async () => {
      await result.current.saveUsername('!!!');
    });
    expect(result.current.error).toBe('Invalid format');
  });

  it('toggles saving around the request', async () => {
    mockFetch(200, { ok: true });
    const { result } = renderHook(() => useSaveFortniteUsername());
    expect(result.current.saving).toBe(false);
    await act(async () => {
      await result.current.saveUsername('NinjaPlayer');
    });
    expect(result.current.saving).toBe(false);
  });
});
