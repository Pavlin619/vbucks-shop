'use client';

import Button from '@/components/ui/Button';

interface CheckoutButtonProps {
  loading: boolean;
  error: string | null;
  onCheckout: () => void;
}

/** Submit button + inline error message for the cart checkout flow. */
export default function CheckoutButton({ loading, error, onCheckout }: CheckoutButtonProps) {
  return (
    <>
      {error && (
        <p className="mb-4 text-sm text-red-400 text-center" role="alert">
          {error}
        </p>
      )}

      <Button
        size="lg"
        fullWidth
        onClick={onCheckout}
        disabled={loading}
        data-testid="checkout-btn"
      >
        {loading ? 'Зареждане…' : 'Към плащането'}
      </Button>
    </>
  );
}
