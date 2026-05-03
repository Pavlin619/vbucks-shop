'use client';

import { ShoppingCart, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { formatPrice } from '@/lib/vbucks-packs';
import type { VBucksPack } from '@/types';

interface AddedToCartModalProps {
  pack: VBucksPack;
  onClose: () => void;
}

/**
 * Confirmation modal shown after a user adds a V-Bucks pack to their cart.
 * Pure presentational + close handler — the parent owns the open/closed
 * state by mounting/unmounting this component.
 */
export default function AddedToCartModal({ pack, onClose }: AddedToCartModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-overlay backdrop-blur-sm"
      onClick={onClose}
      data-testid="added-to-cart-modal"
    >
      <Card
        variant="highlight"
        padding="p-8"
        className="w-full max-w-sm relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-muted hover:text-brand-text"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 bg-brand-accent/15 border-2 border-brand-accent">
          <ShoppingCart className="w-6 h-6 text-brand-accent" />
        </div>

        <h3 className="text-xl font-bold text-center mb-1 text-brand-text">
          Добавено в количката!
        </h3>
        <p className="text-center text-brand-muted mb-6">
          {pack.vbucks.toLocaleString()} V-Bucks &mdash; {formatPrice(pack.price_cents)}
        </p>

        <div className="flex flex-col gap-3">
          <Button as="link" href="/cart" data-testid="go-to-cart" fullWidth>
            Към количката
          </Button>
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={onClose}
            data-testid="continue-shopping"
          >
            Продължи пазаруването
          </Button>
        </div>
      </Card>
    </div>
  );
}
