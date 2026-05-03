'use client';

import { Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/vbucks-packs';
import type { VBucksPack } from '@/types';

interface CartLineItemProps {
  pack: VBucksPack;
  quantity: number;
  onRemove: () => void;
}

/** Single pack row inside the cart. */
export default function CartLineItem({ pack, quantity, onRemove }: CartLineItemProps) {
  return (
    <div
      data-testid={`cart-item-${pack.id}`}
      className="flex items-center justify-between rounded-2xl px-6 py-5 bg-brand-purple"
    >
      <div>
        <p className="font-bold text-lg text-brand-text">
          {pack.vbucks.toLocaleString()} V-Bucks
        </p>
        <p className="text-sm text-brand-muted">
          {formatPrice(pack.price_cents)} × {quantity}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <p className="font-bold text-lg text-brand-accent">
          {formatPrice(pack.price_cents * quantity)}
        </p>
        <button
          onClick={onRemove}
          data-testid={`remove-item-${pack.id}`}
          className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-white/10 transition-colors"
          aria-label="Премахни"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
