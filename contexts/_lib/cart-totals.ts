import { getPackById } from '@/lib/vbucks-packs';
import type { CartItem } from '@/contexts/CartContext';

// `import type` keeps the runtime graph one-way; see cart-storage.ts.

export interface CartTotals {
  totalItems: number;
  totalVbucks: number;
  totalCents: number;
}

/**
 * Derive the three running totals shown next to the cart from a flat
 * list of items + their quantities. Items referencing an unknown pack id
 * (e.g. a pack we removed since the user added it) contribute 0 to the
 * money totals but still count as items in the cart.
 */
export function computeCartTotals(items: CartItem[]): CartTotals {
  let totalItems = 0;
  let totalVbucks = 0;
  let totalCents = 0;

  for (const item of items) {
    totalItems += item.quantity;
    const pack = getPackById(item.packId);
    if (!pack) continue;
    totalVbucks += pack.vbucks * item.quantity;
    totalCents += pack.price_cents * item.quantity;
  }

  return { totalItems, totalVbucks, totalCents };
}
