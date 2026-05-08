'use client';

import 'client-only';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface PlaceOrderSuccess {
  orderId: string;
  skinName: string;
  vbucksCost: number;
  remainingBalance: number;
}

interface UsePlaceOrderResult {
  loading: boolean;
  error: string | null;
  success: PlaceOrderSuccess | null;
  placeOrder: () => Promise<void>;
  reset: () => void;
}

/**
 * Encapsulates the POST `/api/orders` call and the surrounding UI state.
 * Lives next to the detail page because no other route triggers a single-
 * skin order today; if a future "buy now" surface needs the same flow it
 * can move up into a shared `_lib/`.
 *
 * Behaviour:
 *  - 401 → redirect the user to /sign-in (middleware will resume after).
 *  - 2xx → expose the success payload so the caller can render outcome UI.
 *  - any other status → expose the API's `error` string (or a fallback).
 *  - loading state always resets in `finally` so the button re-enables.
 */
export function usePlaceOrder(skinId: string): UsePlaceOrderResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<PlaceOrderSuccess | null>(null);
  const router = useRouter();

  async function placeOrder() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skinId }),
      });
      
      if (res.status === 401) {
        router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof body?.error === 'string' ? body.error : 'Поръчката не успя',
        );
      }

      setSuccess({
        orderId: body.orderId,
        skinName: body.skinName,
        vbucksCost: body.vbucksCost,
        remainingBalance: body.remainingBalance,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Поръчката не успя');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setError(null);
    setSuccess(null);
  }

  return { loading, error, success, placeOrder, reset };
}
