'use client';

import 'client-only';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { loadFromStorage, saveToStorage } from '@/contexts/_lib/cart-storage';
import { computeCartTotals } from '@/contexts/_lib/cart-totals';

export interface CartItem {
  packId: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (packId: string) => void;
  removeItem: (packId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalVbucks: number;
  totalCents: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function mergeCartItems(base: CartItem[], incoming: CartItem[]): CartItem[] {
  const map = new Map(base.map((i) => [i.packId, i.quantity]));
  for (const item of incoming) {
    map.set(item.packId, (map.get(item.packId) ?? 0) + item.quantity);
  }
  return Array.from(map, ([packId, quantity]) => ({ packId, quantity }));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  // Treat Clerk's loading state as guest so cart interactions work immediately.
  const userId = isLoaded ? (user?.id ?? null) : null;
  const [items, setItems] = useState<CartItem[]>([]);
  // undefined = not yet initialised; null = guest; string = logged-in user
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const prev = prevUserIdRef.current;
    prevUserIdRef.current = userId;

    if (prev === null && userId !== null) {
      // Login transition: merge guest cart into the user's saved cart.
      const guestItems = loadFromStorage(null);
      const userItems = loadFromStorage(userId);
      const merged = mergeCartItems(userItems, guestItems);
      saveToStorage(userId, merged);
      saveToStorage(null, []);
      setItems(merged);
    } else {
      // Initial load, logout, or account switch — just load the right cart.
      setItems(loadFromStorage(userId));
    }
  }, [userId]);

  const addItem = useCallback((packId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.packId === packId);
      const next = existing
        ? prev.map((i) =>
            i.packId === packId ? { ...i, quantity: i.quantity + 1 } : i,
          )
        : [...prev, { packId, quantity: 1 }];
      saveToStorage(userId, next);
      return next;
    });
  }, [userId]);

  const removeItem = useCallback((packId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.packId !== packId);
      saveToStorage(userId, next);
      return next;
    });
  }, [userId]);

  const clearCart = useCallback(() => {
    saveToStorage(userId, []);
    setItems([]);
  }, [userId]);

  const totals = computeCartTotals(items);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        totalItems: totals.totalItems,
        totalVbucks: totals.totalVbucks,
        totalCents: totals.totalCents,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
