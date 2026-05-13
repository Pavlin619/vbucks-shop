'use client';

import { X, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface ShopRotatedModalProps {
  onClose: () => void;
}

export default function ShopRotatedModal({ onClose }: ShopRotatedModalProps) {
  const router = useRouter();

  function handleRefresh() {
    router.push('/item-shop');
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-overlay backdrop-blur-sm"
      onClick={onClose}
      data-testid="shop-rotated-modal"
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

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-accent/15">
          <RefreshCw className="w-7 h-7 text-brand-accent" />
        </div>

        <h3 className="text-xl font-bold text-center mb-2 text-brand-text">
          Магазинът се обнови
        </h3>

        <p className="text-center text-brand-muted mb-6">
          Тази оферта вече не е налична. Магазинът се обновява всеки ден в 00:00 UTC.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            fullWidth
            onClick={handleRefresh}
            data-testid="shop-rotated-refresh-btn"
          >
            Към новите оферти
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            Затвори
          </Button>
        </div>
      </Card>
    </div>
  );
}
