'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { getPackById } from '@/lib/vbucks-packs';
import { useCheckout } from '@/app/(shop)/cart/_lib/use-checkout';
import EmptyCart from '@/app/(shop)/cart/_components/EmptyCart';
import CartLineItem from '@/app/(shop)/cart/_components/CartLineItem';
import CartSummary from '@/app/(shop)/cart/_components/CartSummary';
import CheckoutButton from '@/app/(shop)/cart/_components/CheckoutButton';

/**
 * Cart page shell. Pulls cart state from context, delegates checkout to
 * `useCheckout`, and composes the line items / summary / checkout button
 * sub-components.
 */
export default function CartContent() {
  const { items, removeItem, clearCart, totalVbucks, totalCents } = useCart();
  const { loading, error, checkout } = useCheckout(items, clearCart);

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
                onRemove={() => removeItem(item.packId)}
              />
            );
          })}
        </div>

        <CartSummary totalVbucks={totalVbucks} totalCents={totalCents} />

        <CheckoutButton loading={loading} error={error} onCheckout={checkout} />
      </div>
    </main>
  );
}
