'use client';

import { useState, useTransition } from 'react';
import type { OrderStatus, SkinOrderWithUsername } from '@/types';

const ROW_CLASSES: Record<OrderStatus, string> = {
  pending: 'border-b border-amber-500/30 bg-amber-500/5',
  gifted: 'border-b border-green-500/30 bg-green-500/5',
  refunded: 'border-b border-rose-500/20 bg-rose-500/5',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderRow({ order }: { order: SkinOrderWithUsername }) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [transitioning, startTransition] = useTransition();

  async function updateStatus(action: 'gifted' | 'refunded') {
    if (status !== 'pending' || transitioning) return;
    const previous = status;
    setStatus(action);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/orders/${order.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: action }),
        });
        if (!res.ok) setStatus(previous);
      } catch {
        setStatus(previous);
      }
    });
  }

  return (
    <tr className={`${ROW_CLASSES[status]} transition-colors`}>
      <td className="py-3 pr-6 font-mono text-sm text-brand-text">
        {order.fortnite_username ?? (
          <span className="text-brand-muted italic">Not set</span>
        )}
      </td>
      <td className="py-3 pr-6 text-sm text-brand-muted">
        {order.email ?? <span className="italic">—</span>}
      </td>
      <td className="py-3 pr-6 text-sm text-brand-muted">
        {order.phone_number ?? <span className="italic">—</span>}
      </td>
      <td className="py-3 pr-6 text-sm text-brand-text">{order.skin_name}</td>
      <td className="py-3 pr-6 text-sm text-brand-text">
        {order.vbucks_cost.toLocaleString()}
      </td>
      <td className="py-3 pr-6 text-sm text-brand-muted">{formatDate(order.created_at)}</td>
      <td className="py-3 text-sm whitespace-nowrap min-w-[160px]">
        {status === 'pending' && (
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="gift-order-btn"
              onClick={() => updateStatus('gifted')}
              disabled={transitioning}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                'bg-green-500/20 text-green-400 hover:bg-green-500/30',
                transitioning ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              Mark as Gifted ✓
            </button>
            <button
              type="button"
              data-testid="refund-order-btn"
              onClick={() => updateStatus('refunded')}
              disabled={transitioning}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30',
                transitioning ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              Refund
            </button>
          </div>
        )}
        {status === 'gifted' && (
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 text-green-400">
            ✓ Gifted
          </span>
        )}
        {status === 'refunded' && (
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/20 text-rose-400">
            Refunded
          </span>
        )}
      </td>
    </tr>
  );
}
