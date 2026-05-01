'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, X } from 'lucide-react';
import { VBUCKS_PACKS, formatPrice } from '@/lib/vbucks-packs';
import { useCart } from '@/contexts/CartContext';
import type { VBucksPack } from '@/types';

export default function PackagesSection() {
  const { addItem } = useCart();
  const [addedPack, setAddedPack] = useState<VBucksPack | null>(null);

  function handleBuy(pack: VBucksPack) {
    addItem(pack.id);
    setAddedPack(pack);
  }

  return (
    <section id="packages" className="py-20 px-4" style={{ backgroundColor: '#011627' }}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4" style={{ color: '#f6f7f8' }}>
          Изберете Вашия Пакет
        </h2>
        <p className="text-center text-gray-400 mb-16 text-lg">
          Изберете перфектната сума за вашите гейминг нужди
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {Object.values(VBUCKS_PACKS).map((pack) => (
            <div
              key={pack.id}
              className="relative rounded-2xl p-8 border-2 transition-all hover:scale-105"
              style={{
                backgroundColor: '#36213e',
                borderColor: pack.popular ? '#ff3366' : 'rgba(1, 22, 39, 0.8)',
                boxShadow: pack.popular
                  ? '0 20px 25px -5px rgba(255, 51, 102, 0.2)'
                  : 'none',
              }}
            >
              {pack.popular && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap"
                  style={{ backgroundColor: '#ff3366', color: '#f6f7f8' }}
                >
                  Най-популярен
                </div>
              )}

              <div className="text-center">
                <div className="text-5xl font-bold mb-2" style={{ color: '#f6f7f8' }}>
                  {pack.vbucks.toLocaleString()}
                </div>
                <div className="text-gray-400 mb-6">V-Bucks</div>
                <div className="text-3xl font-bold mb-8" style={{ color: '#ff3366' }}>
                  {formatPrice(pack.price_cents)}
                </div>

                <button
                  onClick={() => handleBuy(pack)}
                  data-testid={`buy-pack-${pack.id}`}
                  className="w-full py-3 rounded-full font-semibold transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: pack.popular ? '#ff3366' : '#011627',
                    color: '#f6f7f8',
                    border: pack.popular ? 'none' : '1px solid rgba(246,247,248,0.2)',
                  }}
                >
                  Купи Сега
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Added-to-cart modal */}
      {addedPack && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(1, 22, 39, 0.85)', backdropFilter: 'blur(4px)' }}
          onClick={() => setAddedPack(null)}
          data-testid="added-to-cart-modal"
        >
          <div
            className="w-full max-w-sm rounded-2xl p-8 relative"
            style={{ backgroundColor: '#36213e', border: '2px solid #ff3366' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAddedPack(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Checkmark */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: 'rgba(255, 51, 102, 0.15)', border: '2px solid #ff3366' }}
            >
              <ShoppingCart className="w-6 h-6" style={{ color: '#ff3366' }} />
            </div>

            <h3 className="text-xl font-bold text-center mb-1" style={{ color: '#f6f7f8' }}>
              Добавено в количката!
            </h3>
            <p className="text-center text-gray-400 mb-6">
              {addedPack.vbucks.toLocaleString()} V-Bucks &mdash; {formatPrice(addedPack.price_cents)}
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/cart"
                data-testid="go-to-cart"
                className="block text-center py-3 rounded-full font-semibold transition-colors hover:opacity-90"
                style={{ backgroundColor: '#ff3366', color: '#f6f7f8' }}
              >
                Към количката
              </Link>
              <button
                onClick={() => setAddedPack(null)}
                data-testid="continue-shopping"
                className="py-3 rounded-full font-semibold text-sm transition-colors hover:bg-white/10"
                style={{ color: '#f6f7f8', border: '1px solid rgba(246,247,248,0.25)' }}
              >
                Продължи пазаруването
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
