'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getPackById } from '@/lib/vbucks-packs';

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

const STORAGE_KEY = 'vbucks-cart';

function loadFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(loadFromStorage());
  }, []);

  const persist = (next: CartItem[]) => {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addItem = useCallback((packId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.packId === packId);
      const next = existing
        ? prev.map((i) => (i.packId === packId ? { ...i, quantity: i.quantity + 1 } : i))
        : [...prev, { packId, quantity: 1 }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeItem = useCallback((packId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.packId !== packId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    persist([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const totalVbucks = items.reduce((sum, i) => {
    const pack = getPackById(i.packId);
    return sum + (pack?.vbucks ?? 0) * i.quantity;
  }, 0);

  const totalCents = items.reduce((sum, i) => {
    const pack = getPackById(i.packId);
    return sum + (pack?.price_cents ?? 0) * i.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, totalItems, totalVbucks, totalCents }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
