import { formatPrice } from '@/lib/vbucks-packs';

interface CartSummaryProps {
  totalVbucks: number;
  totalCents: number;
}

/** Totals row at the bottom of the cart. */
export default function CartSummary({ totalVbucks, totalCents }: CartSummaryProps) {
  return (
    <div className="rounded-2xl px-6 py-5 mb-6 bg-brand-purple border border-brand-border-strong">
      <div className="flex justify-between mb-2">
        <span className="text-brand-muted">Общо V-Bucks</span>
        <span className="font-bold text-brand-text">
          {totalVbucks.toLocaleString()}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-brand-muted">Обща сума</span>
        <span
          data-testid="cart-total"
          className="text-xl font-extrabold text-brand-accent"
        >
          {formatPrice(totalCents)}
        </span>
      </div>
    </div>
  );
}
