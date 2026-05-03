'use client';

import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/vbucks-packs';
import type { VBucksPack } from '@/types';

interface PackageCardProps {
  pack: VBucksPack;
  onBuy: (pack: VBucksPack) => void;
}

/**
 * Single V-Bucks pack tile rendered inside `PackagesSection`. Owns no state
 * itself — the parent decides what happens when the user clicks "Buy".
 */
export default function PackageCard({ pack, onBuy }: PackageCardProps) {
  // Popular packs get the accent border + glow; the rest get the
  // default card chrome. We keep both branches local rather than turning
  // them into a Card variant so the popularity badge stays inline.
  const borderClass = pack.popular
    ? 'border-brand-accent shadow-[0_20px_25px_-5px_rgba(255,51,102,0.2)]'
    : 'border-brand-dark/80';

  return (
    <div
      className={`relative rounded-2xl p-8 border-2 transition-all hover:scale-105 bg-brand-purple ${borderClass}`}
    >
      {pack.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap bg-brand-accent text-brand-text">
          Най-популярен
        </div>
      )}

      <div className="text-center">
        <div className="text-5xl font-bold mb-2 text-brand-text">
          {pack.vbucks.toLocaleString()}
        </div>
        <div className="text-brand-muted mb-6">V-Bucks</div>
        <div className="text-3xl font-bold mb-8 text-brand-accent">
          {formatPrice(pack.price_cents)}
        </div>

        <Button
          variant={pack.popular ? 'primary' : 'secondary'}
          fullWidth
          onClick={() => onBuy(pack)}
          data-testid={`buy-pack-${pack.id}`}
        >
          Купи Сега
        </Button>
      </div>
    </div>
  );
}
