import 'client-only';
import type { CartItem } from '@/contexts/CartContext';

// `import type` keeps the runtime graph one-way (storage → CartContext is
// types-only; CartContext → storage is the real runtime dep), so the type
// reference here doesn't create an import cycle at runtime.

export const STORAGE_KEY = 'vbucks-cart';

/**
 * Read the cart from `localStorage`. SSR-safe — returns `[]` when `window`
 * is undefined. Any malformed payload is treated as "no cart" rather than
 * thrown to the caller, so a corrupted entry can't take the page down.
 */
export function loadFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

/** Persist the cart to `localStorage`. No-op on the server. */
export function saveToStorage(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
