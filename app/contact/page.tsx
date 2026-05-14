import type { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingCart, LogIn, Mail, Phone } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Контакт | VBucks Shop',
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="bg-brand-dark min-h-screen py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-brand-text mb-10">Контакт</h1>

          <div className="space-y-6">
            <Card variant="default" padding="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-muted mb-4">
                Бърз достъп
              </h2>
              <div className="space-y-3">
                <Link
                  href="/sign-in"
                  className="flex items-center gap-3 text-brand-text hover:text-brand-accent transition-colors"
                >
                  <LogIn className="w-5 h-5 text-brand-accent shrink-0" />
                  <span className="text-sm font-medium">Влизане</span>
                </Link>
                <Link
                  href="/cart"
                  className="flex items-center gap-3 text-brand-text hover:text-brand-accent transition-colors"
                >
                  <ShoppingCart className="w-5 h-5 text-brand-accent shrink-0" />
                  <span className="text-sm font-medium">Количка</span>
                </Link>
              </div>
            </Card>

            <Card variant="default" padding="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-muted mb-4">
                Информация за контакт
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <a
                      href="mailto:jasonbourne@promociika.com"
                      className="block text-sm text-brand-text hover:text-brand-accent transition-colors"
                    >
                      jasonbourne@promociika.com
                    </a>
                    <a
                      href="mailto:jeffbezos@promociika.com"
                      className="block text-sm text-brand-text hover:text-brand-accent transition-colors"
                    >
                      jeffbezos@promociika.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-brand-accent shrink-0" />
                  <a
                    href="tel:+359889947776"
                    className="text-sm text-brand-text hover:text-brand-accent transition-colors"
                  >
                    +359 889947776
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
