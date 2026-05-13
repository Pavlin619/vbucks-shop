'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface InsufficientBalanceModalProps {
  balance: number;
  cost: number;
  onClose: () => void;
}

export default function InsufficientBalanceModal({
  balance,
  cost,
  onClose,
}: InsufficientBalanceModalProps) {
  const shortfall = Math.max(cost - balance, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-overlay backdrop-blur-sm"
      onClick={onClose}
      data-testid="insufficient-balance-modal"
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

        <h3 className="text-xl font-bold text-center mb-2 text-brand-text">
          Нямате достатъчно V-Bucks
        </h3>

        <p className="text-center text-brand-muted mb-6">
          Нужни са ви още {shortfall.toLocaleString()} V-Bucks за тази оферта.
        </p>

        <div className="space-y-2 mb-6 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-brand-muted">Баланс</span>
            <span className="flex items-center gap-2 text-brand-text font-semibold">
              <Image
                src="/vbucks-coin.jpg"
                alt="V-Bucks"
                width={16}
                height={16}
                className="rounded-full"
              />
              {balance.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-brand-muted">Цена</span>
            <span className="flex items-center gap-2 text-brand-text font-semibold">
              <Image
                src="/vbucks-coin.jpg"
                alt="V-Bucks"
                width={16}
                height={16}
                className="rounded-full"
              />
              {cost.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            as="link"
            href="/"
            fullWidth
            data-testid="buy-vbucks-cta"
          >
            Купи V-Bucks
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
            data-testid="insufficient-close-btn"
          >
            Затвори
          </Button>
        </div>
      </Card>
    </div>
  );
}
