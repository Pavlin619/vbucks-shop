'use client';

import 'client-only';
import { useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';

export interface PlaceOrderSuccess {
  orderId: string;
  skinName: string;
  vbucksCost: number;
  remainingBalance: number;
}

export type PlaceOrderError =
  | { kind: 'no_username'; message: string }
  | { kind: 'forbidden'; message: string }
  | { kind: 'shop_rotated'; message: string }
  | { kind: 'insufficient'; message: string; balance: number; cost: number }
  | { kind: 'transient'; message: string };

interface UsePlaceOrderResult {
  loading: boolean;
  error: PlaceOrderError | null;
  success: PlaceOrderSuccess | null;
  placeOrder: () => Promise<void>;
  reset: () => void;
}

function mapApiError(err: ApiError): PlaceOrderError {
  const message = err.message;
  switch (err.status) {
    case 422:
      return { kind: 'no_username', message };
    case 403:
      return { kind: 'forbidden', message };
    case 404:
      return { kind: 'shop_rotated', message };
    case 409: {
      const balance = typeof err.body.balance === 'number' ? err.body.balance : 0;
      const cost = typeof err.body.cost === 'number' ? err.body.cost : 0;
      return { kind: 'insufficient', message, balance, cost };
    }
    default:
      return { kind: 'transient', message };
  }
}

export function usePlaceOrder(skinId: string): UsePlaceOrderResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PlaceOrderError | null>(null);
  const [success, setSuccess] = useState<PlaceOrderSuccess | null>(null);

  async function placeOrder() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const body = await apiFetch<PlaceOrderSuccess>('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skinId }),
      });
      setSuccess(body);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(mapApiError(e));
      } else {
        setError({ kind: 'transient', message: 'Поръчката не успя' });
      }
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
