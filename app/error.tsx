'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Segment error boundary:', error);
    }
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-brand-dark">
      <Card variant="subtle" padding="p-10" className="max-w-md w-full">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
          <AlertTriangle className="w-8 h-8 text-yellow-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-brand-text">Нещо се обърка</h1>
        <p className="mt-3 text-brand-muted">
          Възникна неочаквана грешка. Опитайте отново или се върнете към началото.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={reset}>Опитайте отново</Button>
          <Button as="link" href="/" variant="secondary">
            Към началото
          </Button>
        </div>
      </Card>
    </main>
  );
}
