'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import OrderStatusBadge from '@/app/(profile)/profile/_components/OrderStatusBadge';
import type { SkinOrder } from '@/types';

export default function MyOrdersPanel({ orders }: { orders: SkinOrder[] }) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? orders.filter((o) =>
        o.skin_name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : orders;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-brand-text">Моите поръчки</h2>
        <span className="text-xs text-brand-muted">{orders.length} поръчки</span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Търси по скин..."
          className="w-full rounded-xl bg-brand-purple border border-white/10 pl-9 pr-4 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          message={query ? 'Няма резултати за тази търсачка.' : 'Нямате направени поръчки.'}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-4 rounded-2xl bg-brand-purple px-5 py-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-text truncate">{order.skin_name}</p>
                <p className="text-xs text-brand-muted mt-0.5">
                  {new Date(order.created_at).toLocaleDateString('bg-BG', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="flex items-center gap-1 text-sm font-semibold text-brand-text">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-cyan-500 text-white text-xs font-bold leading-none">
                    V
                  </span>
                  {order.vbucks_cost.toLocaleString()}
                </span>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
