import 'client-only';
import type { CartItem } from '@/contexts/CartContext';

// `import type` keeps the runtime graph one-way (storage → CartContext is
// types-only; CartContext → storage is the real runtime dep), so the type
// reference here doesn't create an import cycle at runtime.

export function storageKey(userId: string | null): string {
  return userId ? `vbucks-cart-${userId}` : 'vbucks-cart-guest';
}

export function loadFromStorage(userId: string | null): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function saveToStorage(userId: string | null, items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(items));
}
