'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface ConfirmBuyModalProps {
  skinName: string;
  vbucksCost: number;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmBuyModal({
  skinName,
  vbucksCost,
  onConfirm,
  onClose,
}: ConfirmBuyModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-overlay backdrop-blur-sm"
      onClick={onClose}
      data-testid="confirm-buy-modal"
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

        <h3 className="text-xl font-bold text-center mb-1 text-brand-text">
          Потвърди покупката
        </h3>

        <p className="text-center text-brand-muted mb-4">
          Сигурни ли сте, че искате да закупите:
        </p>

        <p className="text-center font-bold text-brand-text mb-2">{skinName}</p>

        <div className="flex items-center justify-center gap-2 mb-8">
          <Image
            src="/vbucks-coin.jpg"
            alt="V-Bucks"
            width={20}
            height={20}
            className="rounded-full"
          />
          <span className="text-brand-muted">{vbucksCost.toLocaleString()} V-Bucks</span>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            fullWidth
            onClick={onConfirm}
            data-testid="confirm-buy-btn"
          >
            Да, купи сега
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
            data-testid="cancel-buy-btn"
          >
            Откажи
          </Button>
        </div>
      </Card>
    </div>
  );
}
