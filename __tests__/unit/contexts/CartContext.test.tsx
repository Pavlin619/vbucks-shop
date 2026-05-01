import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { CartProvider, useCart } from '@/contexts/CartContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
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
      result.current.addItem('500'); // 500 V-Bucks
      result.current.addItem('500'); // +500 V-Bucks
    });
    expect(result.current.totalVbucks).toBe(2000);
  });

  it('totalCents sums the price across all items × quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem('1000'); // 499 cents
      result.current.addItem('500'); // 299 cents
    });
    expect(result.current.totalCents).toBe(798);
  });

  it('persists cart contents to localStorage', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem('1500'));
    const stored = JSON.parse(localStorage.getItem('vbucks-cart') ?? '[]');
    expect(stored).toEqual([{ packId: '1500', quantity: 1 }]);
  });

  it('hydrates from localStorage on mount', () => {
    localStorage.setItem(
      'vbucks-cart',
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
