'use client';

import 'client-only';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(loadFromStorage());
  }, []);

  const persist = (next: CartItem[]) => {
    setItems(next);
    saveToStorage(next);
  };

  const addItem = useCallback((packId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.packId === packId);
      const next = existing
        ? prev.map((i) =>
            i.packId === packId ? { ...i, quantity: i.quantity + 1 } : i,
          )
        : [...prev, { packId, quantity: 1 }];
      saveToStorage(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((packId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.packId !== packId);
      saveToStorage(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    persist([]);
  }, []);

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
