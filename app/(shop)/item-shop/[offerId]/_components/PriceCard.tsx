import type { ReactNode } from 'react';
import Card from '@/components/ui/Card';
import { formatVbucks } from '@/app/(shop)/item-shop/_lib/format';

interface PriceCardProps {
  vbucksCost: number;
  regularPrice: number;
  /**
   * Buy CTA passed in as a child slot so this card stays presentational —
   * the order state (loading / error / success) belongs to the parent
   * client wrapper and never crosses this server-component boundary.
   */
  cta: ReactNode;
}

/**
 * Headline price + buy CTA for the offer. Mirrors the wide pill in the
 * reference design (price on the left, accent button on the right) so
 * "what does it cost / how do I buy it?" is answered in a single glance.
 *
 * Strikethrough regular price renders next to the live price when the
 * offer is on sale; the V-Bucks-saved figure already lives in the meta
 * pills row, so we don't repeat it here.
 */
export default function PriceCard({
  vbucksCost,
  regularPrice,
  cta,
}: PriceCardProps) {
  const isDiscounted = regularPrice > vbucksCost;

  return (
    <Card padding="p-5 sm:p-6" data-testid="price-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold bg-cyan-400 text-brand-dark"
            >
              V
            </span>
            <span
              data-testid="price-card-cost"
              className="text-3xl font-extrabold text-brand-text"
            >
              {formatVbucks(vbucksCost)}
            </span>
          </span>
          {isDiscounted && (
            <span
              data-testid="price-card-regular"
              className="text-base line-through text-brand-text/50"
            >
              {formatVbucks(regularPrice)}
            </span>
          )}
        </div>

        <div className="sm:min-w-[14rem]">{cta}</div>
      </div>
    </Card>
  );
}
