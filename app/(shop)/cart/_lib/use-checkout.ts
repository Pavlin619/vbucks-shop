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

export function useCheckout(items: CartItem[]): UseCheckoutResult {
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
        router.push('/sign-in?redirect_url=/cart');
        return;
      }

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Неуспешно плащане');
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неуспешно плащане');
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, checkout };
}
