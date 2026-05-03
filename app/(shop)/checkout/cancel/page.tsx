import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function CheckoutCancelPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-brand-dark">
      <Card variant="subtle" padding="p-10" className="max-w-md w-full">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
          <span className="text-3xl">✕</span>
        </div>
        <h1 className="text-2xl font-extrabold text-brand-text">
          Плащането е отменено
        </h1>
        <p className="mt-3 text-brand-muted">Не е направено плащане.</p>
        <Button as="link" href="/cart" className="mt-6">
          Назад към количката
        </Button>
      </Card>
    </main>
  );
}
