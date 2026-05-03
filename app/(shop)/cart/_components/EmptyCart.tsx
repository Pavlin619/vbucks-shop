import { ShoppingCart, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

/** Empty-state shown when the cart contains no items. */
export default function EmptyCart() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-brand-dark"
      data-testid="cart-empty"
    >
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-brand-accent/15 border-2 border-brand-border-strong">
        <ShoppingCart className="w-9 h-9 text-brand-accent" />
      </div>
      <h1 className="text-2xl font-bold mb-3 text-brand-text">Количката е празна</h1>
      <p className="text-brand-muted mb-8">Добавете V-Bucks пакет от началната страница.</p>
      <Button as="link" href="/#packages">
        <ArrowLeft className="w-4 h-4" />
        Разгледай пакетите
      </Button>
    </main>
  );
}
