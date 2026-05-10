'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { getPackById } from '@/lib/vbucks-packs';
import { useCheckout } from '@/app/(shop)/cart/_lib/use-checkout';
import EmptyCart from '@/app/(shop)/cart/_components/EmptyCart';
import CartLineItem from '@/app/(shop)/cart/_components/CartLineItem';
import CartSummary from '@/app/(shop)/cart/_components/CartSummary';
import PurchaseSteps from '@/app/(shop)/cart/_components/PurchaseSteps';

interface CartContentProps {
  isAuthenticated: boolean;
  fortniteUsername: string | null;
}

export default function CartContent({ isAuthenticated, fortniteUsername }: CartContentProps) {
  const { items, addItem, decrementItem, removeItem, totalVbucks, totalCents } = useCart();
  const { loading, error, checkout } = useCheckout(items);

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <main className="min-h-screen px-4 py-28 bg-brand-dark">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/#packages"
          className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Продължи пазаруването
        </Link>

        <h1 className="text-3xl font-extrabold mb-8 text-brand-text">Количка</h1>

        <div className="space-y-4 mb-8">
          {items.map((item) => {
            const pack = getPackById(item.packId);
            if (!pack) return null;
            return (
              <CartLineItem
                key={item.packId}
                pack={pack}
                quantity={item.quantity}
                onIncrement={() => addItem(item.packId)}
                onDecrement={() => decrementItem(item.packId)}
                onRemove={() => removeItem(item.packId)}
              />
            );
          })}
        </div>

        <CartSummary totalVbucks={totalVbucks} totalCents={totalCents} />

        <PurchaseSteps
          isAuthenticated={isAuthenticated}
          fortniteUsername={fortniteUsername}
          onCheckout={checkout}
          checkoutLoading={loading}
          checkoutError={error}
        />
      </div>
    </main>
  );
}
