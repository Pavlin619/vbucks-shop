'use client';

import Button from '@/components/ui/Button';
import PriceCard from '@/app/(shop)/item-shop/[offerId]/_components/PriceCard';
import VBucksBalanceCard from '@/app/(shop)/item-shop/[offerId]/_components/VBucksBalanceCard';
import OrderOutcome from '@/app/(shop)/item-shop/[offerId]/_components/OrderOutcome';
import { usePlaceOrder } from '@/app/(shop)/item-shop/[offerId]/_lib/use-place-order';

interface BuyFlowProps {
  skinId: string;
  vbucksCost: number;
  regularPrice: number;
  userBalance: number;
}

/**
 * Owns the place-order interaction for one shop entry.
 *
 * Renders the price + balance pair while the user hasn't placed an order
 * yet, and swaps the entire group for a single `OrderOutcome` receipt
 * once the API confirms the order. Keeping the state in this single
 * client wrapper means the price/balance cards stay pure server
 * components and the outcome doesn't fragment the visual layout.
 */
export default function BuyFlow({
  skinId,
  vbucksCost,
  regularPrice,
  userBalance,
}: BuyFlowProps) {
  const { loading, error, success, placeOrder } = usePlaceOrder(skinId);

  if (success) {
    return <OrderOutcome success={success} />;
  }

  const sufficient = userBalance >= vbucksCost;
  const buttonLabel = loading ? 'Заявяваме поръчката…' : 'Купи сега';

  return (
    <div className="space-y-3">
      <PriceCard
        vbucksCost={vbucksCost}
        regularPrice={regularPrice}
        cta={
          <Button
            size="md"
            fullWidth
            onClick={placeOrder}
            disabled={loading || !sufficient}
            data-testid="buy-skin-btn"
          >
            {buttonLabel}
          </Button>
        }
      />

      <VBucksBalanceCard balance={userBalance} cost={vbucksCost} />

      {!sufficient && !error && (
        <p
          role="status"
          data-testid="buy-skin-insufficient"
          className="text-sm text-center text-brand-accent"
        >
          Нямате достатъчно V-Bucks за тази оферта.
        </p>
      )}

      {error && (
        <p
          role="alert"
          data-testid="buy-skin-error"
          className="text-sm text-center text-brand-accent"
        >
          {error}
        </p>
      )}
    </div>
  );
}
