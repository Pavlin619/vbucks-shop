import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Политика за Възстановяване | VBucks Shop',
};

export default function RefundPolicyPage() {
  return (
    <>
      <Header />
      <main className="bg-brand-dark min-h-screen py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold text-brand-text mb-2">
            Политика за Възстановяване
          </h1>
          <p className="text-brand-muted text-sm">Последна актуализация: 2026</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
