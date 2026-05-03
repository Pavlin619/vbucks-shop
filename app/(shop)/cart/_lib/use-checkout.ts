'use client';

import 'client-only';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CartItem } from '@/contexts/CartContext';

interface UseCheckoutResult {
  loading: boolean;
  error: string | null;
  checkout: () => Promise<void>;
}

/**
 * Encapsulates the cart-checkout flow: POSTs the current cart to
 * `/api/checkout`, redirects unauthenticated users to sign-in, clears the
 * cart on success, and exposes loading/error state for the UI.
 *
 * Lives next to the cart page because no other route needs it; if a future
 * "buy now" button on a different page needs the same flow it can move up.
 */
export function useCheckout(
  items: CartItem[],
  onSuccess: () => void,
): UseCheckoutResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function checkout() {
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
      onSuccess();
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неуспешно плащане');
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, checkout };
}
