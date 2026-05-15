'use client';

import 'client-only';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { loadFromStorage, saveToStorage } from '@/contexts/_lib/cart-storage';
import { computeCartTotals } from '@/contexts/_lib/cart-totals';
import { getPackById } from '@/lib/vbucks-packs';
import { useToast } from '@/contexts/ToastContext';

export interface CartItem {
  packId: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (packId: string) => void;
  decrementItem: (packId: string) => void;
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

function pruneStaleItems(rawItems: CartItem[]): { valid: CartItem[]; hadStale: boolean } {
  const valid = rawItems.filter((i) => getPackById(i.packId) !== undefined);
  return { valid, hadStale: valid.length < rawItems.length };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { push } = useToast();
  // Treat Clerk's loading state as guest so cart interactions work immediately.
  const userId = isLoaded ? (user?.id ?? null) : null;
  const [items, setItems] = useState<CartItem[]>([]);
  // undefined = not yet initialised; null = guest; string = logged-in user
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const prev = prevUserIdRef.current;
    prevUserIdRef.current = userId;

    let loaded: CartItem[];
    if (prev === null && userId !== null) {
      // Login transition: merge guest cart into the user's saved cart.
      const guestItems = loadFromStorage(null);
      const userItems = loadFromStorage(userId);
      loaded = mergeCartItems(userItems, guestItems);
    } else {
      // Initial load, logout, or account switch — just load the right cart.
      loaded = loadFromStorage(userId);
    }

    const isLoginTransition = prev === null && userId !== null;
    const { valid, hadStale } = pruneStaleItems(loaded);

    if (hadStale) {
      saveToStorage(userId, valid);
      push({ variant: 'error', message: 'Some items in your cart are no longer available and were removed.' });
    }

    if (isLoginTransition) {
      if (!hadStale) saveToStorage(userId, valid);
      saveToStorage(null, []);
    }

    // Syncing from localStorage (an external system) when auth state changes is
    // exactly what this effect is for; the rule is overly broad here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(valid);
  }, [userId, push]);

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

  const decrementItem = useCallback((packId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.packId === packId);
      const next =
        existing && existing.quantity > 1
          ? prev.map((i) =>
              i.packId === packId ? { ...i, quantity: i.quantity - 1 } : i,
            )
          : prev.filter((i) => i.packId !== packId);
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
        decrementItem,
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
