'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/vbucks-packs';
import RemoveFromCartModal from '@/app/(shop)/cart/_components/RemoveFromCartModal';
import type { VBucksPack } from '@/types';

const MAX_QUANTITY = 10;

interface CartLineItemProps {
  pack: VBucksPack;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export default function CartLineItem({ pack, quantity, onIncrement, onDecrement, onRemove }: CartLineItemProps) {
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  return (
    <>
      <div
        data-testid={`cart-item-${pack.id}`}
        className="flex items-center justify-between rounded-2xl px-6 py-5 bg-brand-purple"
      >
        <div className="flex items-center gap-3">
          <Image
            src="/vbucks-coin.jpg"
            alt="V-Bucks"
            width={36}
            height={36}
            className="rounded-full shrink-0"
          />
          <div>
            <p className="font-bold text-lg text-brand-text">
              {pack.vbucks.toLocaleString()} V-Bucks
            </p>
            <p className="text-sm text-brand-muted">
              {formatPrice(pack.price_cents)} / бр.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-brand-border-strong bg-brand-dark">
            <button
              onClick={onDecrement}
              disabled={quantity <= 1}
              data-testid={`decrement-item-${pack.id}`}
              className="p-2 rounded-l-xl text-brand-muted hover:text-brand-text hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Намали количеството"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span
              data-testid={`quantity-${pack.id}`}
              className="w-7 text-center text-sm font-bold text-brand-text select-none"
            >
              {quantity}
            </span>
            <button
              onClick={onIncrement}
              disabled={quantity >= MAX_QUANTITY}
              data-testid={`increment-item-${pack.id}`}
              className="p-2 rounded-r-xl text-brand-muted hover:text-brand-text hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Увеличи количеството"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="font-bold text-lg text-brand-accent w-16 text-right">
            {formatPrice(pack.price_cents * quantity)}
          </p>

          <button
            onClick={() => setShowRemoveModal(true)}
            data-testid={`remove-item-${pack.id}`}
            className="p-2 rounded-lg text-brand-muted hover:text-red-400 hover:bg-white/10 transition-colors"
            aria-label="Премахни"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showRemoveModal && (
        <RemoveFromCartModal
          pack={pack}
          onConfirm={() => {
            setShowRemoveModal(false);
            onRemove();
          }}
          onClose={() => setShowRemoveModal(false)}
        />
      )}
    </>
  );
}
