import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { storageKey } from '@/contexts/_lib/cart-storage';

vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
}));

import { useUser } from '@clerk/nextjs';
const mockUseUser = vi.mocked(useUser);

// Shorthand helpers
const asGuest = () =>
  mockUseUser.mockReturnValue({ user: null, isLoaded: true } as unknown as ReturnType<typeof useUser>);

const asUser = (id: string) =>
  mockUseUser.mockReturnValue({ user: { id }, isLoaded: true } as unknown as ReturnType<typeof useUser>);

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
    asGuest();
  });

  it('starts with an empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalVbucks).toBe(0);
    expect(result.current.totalCents).toBe(0);
  });

  it('addItem adds a new pack with quantity 1', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem('1000'));
    expect(result.current.items).toEqual([{ packId: '1000', quantity: 1 }]);
    expect(result.current.totalItems).toBe(1);
  });

  it('addItem increments quantity for an existing pack', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem('1000');
      result.current.addItem('1000');
      result.current.addItem('1000');
    });
    expect(result.current.items).toEqual([{ packId: '1000', quantity: 3 }]);
    expect(result.current.totalItems).toBe(3);
  });

  it('addItem keeps separate entries for different packs', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem('500');
      result.current.addItem('1000');
    });
    expect(result.current.items).toHaveLength(2);
    expect(result.current.totalItems).toBe(2);
  });

  it('removeItem removes the pack entirely (not by quantity)', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem('1000');
      result.current.addItem('1000');
      result.current.removeItem('1000');
    });
    expect(result.current.items).toEqual([]);
  });

  it('clearCart empties the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem('500');
      result.current.addItem('1000');
      result.current.clearCart();
    });
    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
  });

  it('totalVbucks sums the V-Bucks across all items × quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem('1000'); // 1000 V-Bucks
      result.current.addItem('500');  // 500 V-Bucks
      result.current.addItem('500');  // +500 V-Bucks
    });
    expect(result.current.totalVbucks).toBe(2000);
  });

  it('totalCents sums the price across all items × quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem('1000'); // 499 cents
      result.current.addItem('500');  // 299 cents
    });
    expect(result.current.totalCents).toBe(798);
  });

  it('persists cart contents to guest localStorage key', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem('1500'));
    const stored = JSON.parse(localStorage.getItem(storageKey(null)) ?? '[]');
    expect(stored).toEqual([{ packId: '1500', quantity: 1 }]);
  });

  it('hydrates from guest localStorage key on mount', () => {
    localStorage.setItem(
      storageKey(null),
      JSON.stringify([{ packId: '500', quantity: 2 }]),
    );
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([{ packId: '500', quantity: 2 }]);
    expect(result.current.totalItems).toBe(2);
  });

  it('useCart throws when used outside CartProvider', () => {
    expect(() => renderHook(() => useCart())).toThrow(
      'useCart must be used inside CartProvider',
    );
  });
});

describe('CartContext — per-user isolation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads the correct cart for a logged-in user', async () => {
    localStorage.setItem(storageKey('user1'), JSON.stringify([{ packId: '500', quantity: 3 }]));
    asUser('user1');
    const { result } = renderHook(() => useCart(), { wrapper });
    await act(async () => {});
    expect(result.current.items).toEqual([{ packId: '500', quantity: 3 }]);
  });

  it('isolates carts between two different users', async () => {
    localStorage.setItem(storageKey('user1'), JSON.stringify([{ packId: '500', quantity: 1 }]));
    localStorage.setItem(storageKey('user2'), JSON.stringify([{ packId: '1000', quantity: 2 }]));

    asUser('user1');
    const { result, rerender } = renderHook(() => useCart(), { wrapper });
    await act(async () => {});
    expect(result.current.items).toEqual([{ packId: '500', quantity: 1 }]);

    asUser('user2');
    rerender();
    await act(async () => {});
    expect(result.current.items).toEqual([{ packId: '1000', quantity: 2 }]);
  });

  it('persists items under the user-scoped key, not the guest key', async () => {
    asUser('user1');
    const { result } = renderHook(() => useCart(), { wrapper });
    await act(async () => {
      result.current.addItem('1000');
    });
    expect(JSON.parse(localStorage.getItem(storageKey('user1')) ?? '[]')).toEqual([
      { packId: '1000', quantity: 1 },
    ]);
    expect(localStorage.getItem(storageKey(null))).toBeNull();
  });
});

describe('CartContext — guest-to-user merge on login', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('merges guest cart into an empty user cart on login', async () => {
    asGuest();
    const { result, rerender } = renderHook(() => useCart(), { wrapper });
    await act(async () => {
      result.current.addItem('500');
      result.current.addItem('1000');
    });

    asUser('user1');
    rerender();
    await act(async () => {});

    expect(result.current.items).toContainEqual({ packId: '500', quantity: 1 });
    expect(result.current.items).toContainEqual({ packId: '1000', quantity: 1 });
  });

  it('sums quantities when guest and user have the same pack', async () => {
    localStorage.setItem(
      storageKey('user1'),
      JSON.stringify([{ packId: '500', quantity: 1 }]),
    );

    asGuest();
    const { result, rerender } = renderHook(() => useCart(), { wrapper });
    await act(async () => {
      result.current.addItem('500'); // guest: 1× '500'
    });

    asUser('user1');
    rerender();
    await act(async () => {});

    // user had 1, guest had 1 → merged = 2
    expect(result.current.items).toEqual([{ packId: '500', quantity: 2 }]);
  });

  it('clears the guest cart key after merging', async () => {
    asGuest();
    const { result, rerender } = renderHook(() => useCart(), { wrapper });
    await act(async () => {
      result.current.addItem('500');
    });

    asUser('user1');
    rerender();
    await act(async () => {});

    expect(JSON.parse(localStorage.getItem(storageKey(null)) ?? '[]')).toEqual([]);
  });

  it('does not merge when already logged in (no guest transition)', async () => {
    localStorage.setItem(
      storageKey(null),
      JSON.stringify([{ packId: '500', quantity: 5 }]),
    );
    localStorage.setItem(
      storageKey('user1'),
      JSON.stringify([{ packId: '1000', quantity: 1 }]),
    );

    // Mount already as user1 — no null→string transition, so guest cart is ignored
    asUser('user1');
    const { result } = renderHook(() => useCart(), { wrapper });
    await act(async () => {});

    expect(result.current.items).toEqual([{ packId: '1000', quantity: 1 }]);
  });
});
