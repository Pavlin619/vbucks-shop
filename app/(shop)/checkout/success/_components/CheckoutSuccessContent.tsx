'use client';

import 'client-only';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type VerifyState = 'loading' | 'success' | 'error';

export default function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();
  const [state, setState] = useState<VerifyState>('loading');

  useEffect(() => {
    if (!sessionId) {
      setState('error');
      return;
    }

    fetch(`/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data: { paid: boolean }) => {
        if (data.paid) {
          clearCart();
          setState('success');
        } else {
          setState('error');
        }
      })
      .catch(() => setState('error'));
  }, [sessionId, clearCart]);

  if (state === 'loading') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-brand-dark">
        <Card variant="highlight" padding="p-10" className="max-w-md w-full">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-accent/15">
            <span className="text-3xl animate-pulse">⋯</span>
          </div>
          <p className="text-brand-muted">Потвърждаване на плащането...</p>
        </Card>
      </main>
    );
  }

  if (state === 'error') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-brand-dark">
        <Card variant="subtle" padding="p-10" className="max-w-md w-full">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <span className="text-3xl">⚠</span>
          </div>
          <h1 className="text-2xl font-extrabold text-brand-text">
            Не успяхме да потвърдим плащането
          </h1>
          <p className="mt-3 text-brand-muted">
            Ако сте завършили поръчка, вашите V-Bucks ще бъдат кредитирани скоро.
            Свържете се с нас, ако проблемът продължава.
          </p>
          <Button as="link" href="/cart" className="mt-6">
            Назад към количката
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-brand-dark">
      <Card variant="highlight" padding="p-10" className="max-w-md w-full">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-accent/15">
          <span className="text-3xl">✓</span>
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
