'use client';

import 'client-only';
import { useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { CartItem } from '@/contexts/CartContext';

export type CheckoutError =
  | { kind: 'no_username'; message: string }
  | { kind: 'invalid_cart'; message: string }
  | { kind: 'transient'; message: string };

interface UseCheckoutResult {
  loading: boolean;
  error: CheckoutError | null;
  checkout: () => Promise<void>;
}

function mapApiError(err: ApiError): CheckoutError {
  if (err.status === 422) return { kind: 'no_username', message: err.message };
  if (err.status === 400) return { kind: 'invalid_cart', message: err.message };
  return { kind: 'transient', message: err.message };
}

export function useCheckout(items: CartItem[]): UseCheckoutResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CheckoutError | null>(null);

  async function checkout() {
    setLoading(true);
    setError(null);

    try {
      const { url } = await apiFetch<{ url: string }>('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
        signInRedirectTo: '/cart',
      });
      window.location.href = url;
    } catch (e) {
      if (e instanceof ApiError) {
        setError(mapApiError(e));
      } else {
        setError({ kind: 'transient', message: 'Неуспешно плащане' });
      }
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, checkout };
}
