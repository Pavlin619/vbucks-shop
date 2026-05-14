'use client';

import { useState } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import PriceCard from '@/app/(shop)/item-shop/[offerId]/_components/PriceCard';
import VBucksBalanceCard from '@/app/(shop)/item-shop/[offerId]/_components/VBucksBalanceCard';
import OrderOutcome from '@/app/(shop)/item-shop/[offerId]/_components/OrderOutcome';
import ConfirmBuyModal from '@/app/(shop)/item-shop/[offerId]/_components/ConfirmBuyModal';
import InsufficientBalanceModal from '@/app/(shop)/item-shop/[offerId]/_components/InsufficientBalanceModal';
import ShopRotatedModal from '@/app/(shop)/item-shop/[offerId]/_components/ShopRotatedModal';
import { usePlaceOrder } from '@/app/(shop)/item-shop/[offerId]/_lib/use-place-order';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

interface BuyFlowProps {
  skinId: string;
  skinName: string;
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
  skinName,
  vbucksCost,
  regularPrice,
  userBalance,
}: BuyFlowProps) {
  const { loading, error, success, placeOrder, reset } = usePlaceOrder(skinId);
  const [showConfirm, setShowConfirm] = useState(false);

  if (success) {
    return <OrderOutcome success={success} />;
  }

  const sufficient = userBalance >= vbucksCost;
  const buttonLabel = loading ? 'Заявяваме поръчката…' : 'Купи сега';

  function handleConfirm() {
    setShowConfirm(false);
    placeOrder();
  }

  return (
    <>
      <LoadingOverlay visible={loading} />
      {showConfirm && (
        <ConfirmBuyModal
          skinName={skinName}
          vbucksCost={vbucksCost}
          onConfirm={handleConfirm}
          onClose={() => setShowConfirm(false)}
        />
      )}

      {error?.kind === 'insufficient' && (
        <InsufficientBalanceModal
          balance={error.balance}
          cost={error.cost}
          onClose={reset}
        />
      )}

      {error?.kind === 'shop_rotated' && <ShopRotatedModal onClose={reset} />}

      <div className="space-y-3">
        <PriceCard
          vbucksCost={vbucksCost}
          regularPrice={regularPrice}
          cta={
            <Button
              size="md"
              fullWidth
              onClick={() => setShowConfirm(true)}
              disabled={loading || !sufficient}
              data-testid="buy-skin-btn"
            >
              {buttonLabel}
            </Button>
          }
        />

        <VBucksBalanceCard balance={userBalance} cost={vbucksCost} />

        {!sufficient && !error && (
          <Alert
            variant="info"
            data-testid="buy-skin-insufficient"
            className="text-center"
          >
            Нямате достатъчно V-Bucks за тази оферта.
          </Alert>
        )}

        {error?.kind === 'no_username' && (
          <Alert
            variant="warning"
            data-testid="buy-skin-error"
            action={
              <Button as="link" href="/profile" size="sm" variant="secondary">
                Профил
              </Button>
            }
          >
            Задайте Fortnite потребителско име в профила си преди покупка.
          </Alert>
        )}

        {error?.kind === 'forbidden' && (
          <Alert variant="info" data-testid="buy-skin-error">
            {error.message}
          </Alert>
        )}

        {error?.kind === 'transient' && (
          <Alert
            variant="error"
            data-testid="buy-skin-error"
            action={
              <Button size="sm" onClick={placeOrder} disabled={loading}>
                Опитайте отново
              </Button>
            }
          >
            Поръчката не успя. Моля, опитайте отново.
          </Alert>
        )}
      </div>
    </>
  );
}
