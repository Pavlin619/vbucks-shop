'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatVbucks } from '@/app/(shop)/item-shop/_lib/format';
import type { PlaceOrderSuccess } from '@/app/(shop)/item-shop/[offerId]/_lib/use-place-order';

interface OrderOutcomeProps {
  success: PlaceOrderSuccess;
}

/**
 * Success receipt rendered in place of the buy CTA after `POST /api/orders`
 * resolves with 201. Shows the order id (for support enquiries), the
 * deducted amount, and a CTA back to the shop. Failures are surfaced
 * inline by `BuySkinButton` instead — they don't replace the CTA.
 */
export default function OrderOutcome({ success }: OrderOutcomeProps) {
  return (
    <Card
      variant="highlight"
      padding="p-6"
      data-testid="order-success"
      role="status"
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          aria-hidden
          className="inline-flex items-center justify-center h-10 w-10 rounded-full text-xl font-extrabold bg-brand-accent/15 text-brand-accent"
        >
          ✓
        </span>
        <h2 className="text-xl font-extrabold text-brand-text">
          Поръчката е приета!
        </h2>
      </div>

      <p className="text-brand-text mb-4">
        Заявката за <strong>{success.skinName}</strong> е записана. Администратор
        ще ви подари скина в играта възможно най-скоро.
      </p>

      <dl className="grid grid-cols-2 gap-y-2 text-sm mb-5">
        <dt className="text-brand-muted">Номер</dt>
        <dd
          data-testid="order-id"
          className="font-mono text-brand-text break-all text-right"
        >
          {success.orderId}
        </dd>

        <dt className="text-brand-muted">Удържани V-Bucks</dt>
        <dd className="text-right font-semibold text-brand-text">
          {formatVbucks(success.vbucksCost)}
        </dd>

        <dt className="text-brand-muted">Остатък</dt>
        <dd
          data-testid="order-remaining-balance"
          className="text-right font-extrabold text-brand-text"
        >
          {formatVbucks(success.remainingBalance)}
        </dd>
      </dl>

      <Button as="link" href="/item-shop" fullWidth>
        Към магазина
      </Button>
    </Card>
  );
}
