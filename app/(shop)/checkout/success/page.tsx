import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function CheckoutSuccessPage() {
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
