import Image from 'next/image';
import { formatPrice } from '@/lib/vbucks-packs';

interface CartSummaryProps {
  totalVbucks: number;
  totalCents: number;
}

export default function CartSummary({ totalVbucks, totalCents }: CartSummaryProps) {
  return (
    <div className="rounded-2xl px-6 py-5 mb-6 bg-brand-purple border border-brand-border-strong">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-brand-muted">
          <Image
            src="/vbucks-coin.jpg"
            alt="V-Bucks"
            width={20}
            height={20}
            className="rounded-full"
          />
          <span>Общо V-Bucks</span>
        </div>
        <span className="font-bold text-brand-text">
          {totalVbucks.toLocaleString()}
        </span>
      </div>
      <div className="border-t border-brand-border-strong pt-4 flex justify-between items-center">
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
