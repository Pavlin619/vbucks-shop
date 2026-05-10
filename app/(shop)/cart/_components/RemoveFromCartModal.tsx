'use client';

import { Trash2, X } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { formatPrice } from '@/lib/vbucks-packs';
import type { VBucksPack } from '@/types';

interface RemoveFromCartModalProps {
  pack: VBucksPack;
  onConfirm: () => void;
  onClose: () => void;
}

export default function RemoveFromCartModal({ pack, onConfirm, onClose }: RemoveFromCartModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-overlay backdrop-blur-sm"
      onClick={onClose}
      data-testid="remove-from-cart-modal"
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
          aria-label="Затвори"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 bg-white/10">
          <Trash2 className="w-6 h-6 text-brand-muted" />
        </div>

        <h3 className="text-xl font-bold text-center mb-1 text-brand-text">
          Премахни от количката?
        </h3>

        <div className="flex items-center justify-center gap-2 mb-6">
          <Image
            src="/vbucks-coin.jpg"
            alt="V-Bucks"
            width={20}
            height={20}
            className="rounded-full"
          />
          <p className="text-center text-brand-muted">
            {pack.vbucks.toLocaleString()} V-Bucks &mdash; {formatPrice(pack.price_cents)}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
            data-testid="cancel-remove"
          >
            Запази в количката
          </Button>
          <button
            onClick={onConfirm}
            data-testid="confirm-remove"
            className="w-full py-2.5 rounded-full text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors"
          >
            Да, премахни
          </button>
        </div>
      </Card>
    </div>
  );
}
