'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { getPackById, formatPrice } from '@/lib/vbucks-packs';

export default function CartContent() {
  const { items, removeItem, clearCart, totalVbucks, totalCents } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (res.status === 401) {
        router.push('/sign-in');
        return;
      }

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Неуспешно плащане');
      }

      const { url } = await res.json();
      clearCart();
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неуспешно плащане');
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center px-4 py-20"
        style={{ backgroundColor: '#011627' }}
        data-testid="cart-empty"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: 'rgba(255,51,102,0.12)', border: '2px solid rgba(255,51,102,0.3)' }}
        >
          <ShoppingCart className="w-9 h-9" style={{ color: '#ff3366' }} />
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: '#f6f7f8' }}>
          Количката е празна
        </h1>
        <p className="text-gray-400 mb-8">Добавете V-Bucks пакет от началната страница.</p>
        <Link
          href="/#packages"
          className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors hover:opacity-90"
          style={{ backgroundColor: '#ff3366', color: '#f6f7f8' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Разгледай пакетите
        </Link>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen px-4 py-28"
      style={{ backgroundColor: '#011627' }}
    >
      <div className="max-w-2xl mx-auto">
        <Link
          href="/#packages"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Продължи пазаруването
        </Link>

        <h1 className="text-3xl font-extrabold mb-8" style={{ color: '#f6f7f8' }}>
          Количка
        </h1>

        {/* Item list */}
        <div className="space-y-4 mb-8">
          {items.map((item) => {
            const pack = getPackById(item.packId);
            if (!pack) return null;

            return (
              <div
                key={item.packId}
                data-testid={`cart-item-${item.packId}`}
                className="flex items-center justify-between rounded-2xl px-6 py-5"
                style={{ backgroundColor: '#36213e' }}
              >
                <div>
                  <p className="font-bold text-lg" style={{ color: '#f6f7f8' }}>
                    {pack.vbucks.toLocaleString()} V-Bucks
                  </p>
                  <p className="text-sm text-gray-400">
                    {formatPrice(pack.price_cents)} × {item.quantity}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <p className="font-bold text-lg" style={{ color: '#ff3366' }}>
                    {formatPrice(pack.price_cents * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItem(item.packId)}
                    data-testid={`remove-item-${item.packId}`}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Премахни"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div
          className="rounded-2xl px-6 py-5 mb-6"
          style={{ backgroundColor: '#36213e', border: '1px solid rgba(255,51,102,0.25)' }}
        >
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Общо V-Bucks</span>
            <span className="font-bold" style={{ color: '#f6f7f8' }}>
              {totalVbucks.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Обща сума</span>
            <span
              data-testid="cart-total"
              className="text-xl font-extrabold"
              style={{ color: '#ff3366' }}
            >
              {formatPrice(totalCents)}
            </span>
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-400 text-center" role="alert">
            {error}
          </p>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          data-testid="checkout-btn"
          className="w-full py-4 rounded-full text-lg font-bold transition-opacity disabled:opacity-50 hover:opacity-90"
          style={{ backgroundColor: '#ff3366', color: '#f6f7f8' }}
        >
          {loading ? 'Зареждане…' : 'Към плащането'}
        </button>
      </div>
    </main>
  );
}
