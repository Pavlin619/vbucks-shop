'use client';

import 'client-only';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertTriangle, Loader2, Clock } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type VerifyState = 'verifying' | 'paid' | 'pending' | 'error';

// Backoff schedule for the verify endpoint — Stripe webhook lag is typically
// 1–10s; this gives ~20s total across 5 attempts before falling back to the
// "pending" state with a manual retry.
const POLL_DELAYS_MS = [0, 1000, 2000, 3000, 5000, 8000];

function initialState(sessionId: string | null): VerifyState {
  return sessionId ? 'verifying' : 'error';
}

export default function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();
  const [state, setState] = useState<VerifyState>(() => initialState(sessionId));
  const cancelledRef = useRef(false);

  const runPoll = useCallback(async () => {
    if (!sessionId) return;
    cancelledRef.current = false;

    for (const delay of POLL_DELAYS_MS) {
      if (cancelledRef.current) return;
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
      if (cancelledRef.current) return;

      try {
        const res = await fetch(
          `/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`,
        );
        if (!res.ok) {
          setState('error');
          return;
        }
        const data = (await res.json()) as { paid: boolean; pending?: boolean };
        if (data.paid) {
          clearCart();
          setState('paid');
          return;
        }
      } catch {
        setState('error');
        return;
      }
    }

    // Budget exhausted — webhook likely lagging more than the poll window.
    setState('pending');
  }, [sessionId, clearCart]);

  function handleRetry() {
    setState('verifying');
    runPoll();
  }

  useEffect(() => {
    if (!sessionId) return;
    // Polling is the "subscribe to external state" pattern the rule's docs
    // describe — every setState in `runPoll` fires after an `await`, so this
    // does not cascade-render synchronously. The static analyzer can't tell.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runPoll();
    return () => {
      cancelledRef.current = true;
    };
  }, [runPoll, sessionId]);

  if (state === 'verifying') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-brand-dark">
        <Card variant="highlight" padding="p-10" className="max-w-md w-full">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-accent/15">
            <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
          </div>
          <p className="text-brand-muted">Потвърждаване на плащането...</p>
        </Card>
      </main>
    );
  }

  if (state === 'pending') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-brand-dark">
        <Card variant="subtle" padding="p-10" className="max-w-md w-full">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-brand-text">
            Все още чакаме потвърждение
          </h1>
          <p className="mt-3 text-brand-muted">
            Плащането ви се обработва. V-Bucks ще се появят в баланса в рамките на минута.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={handleRetry}>Провери отново</Button>
            <Button as="link" href="/" variant="secondary">
              Към началото
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  if (state === 'error') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-brand-dark">
        <Card variant="subtle" padding="p-10" className="max-w-md w-full">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-brand-text">
            Не успяхме да потвърдим плащането
          </h1>
          <p className="mt-3 text-brand-muted">
            Възникна проблем при свързване със системата за плащания. Свържете се с нас, ако
            проблемът продължава.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={handleRetry}>Опитайте отново</Button>
            <Button as="link" href="/cart" variant="secondary">
              Назад към количката
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-brand-dark">
      <Card variant="highlight" padding="p-10" className="max-w-md w-full">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-accent/15">
          <CheckCircle2 className="w-8 h-8 text-brand-accent" />
        </div>
        <h1 className="text-2xl font-extrabold text-brand-text">
          Плащането е успешно!
        </h1>
        <p className="mt-3 text-brand-muted">
          Вашите V-Bucks са кредитирани. Може да отнеме няколко секунди да се появят.
        </p>
        <Button as="link" href="/" className="mt-6">
          Към началото
        </Button>
      </Card>
    </main>
  );
}
