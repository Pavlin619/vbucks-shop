import { Suspense } from 'react';
import Card from '@/components/ui/Card';
import CheckoutSuccessContent from './_components/CheckoutSuccessContent';

function LoadingFallback() {
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

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
