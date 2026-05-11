import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SkinHero from '@/app/(shop)/item-shop/[offerId]/_components/SkinHero';
import SkinInfoCard from '@/app/(shop)/item-shop/[offerId]/_components/SkinInfoCard';
import BundleContents from '@/app/(shop)/item-shop/[offerId]/_components/BundleContents';
import BuyFlow from '@/app/(shop)/item-shop/[offerId]/_components/BuyFlow';
import ItemShopAccessGate from '@/app/(shop)/item-shop/_components/ItemShopAccessGate';
import { getProfile } from '@/services/wallet';
import { fetchShopEntries } from '@/services/skins';
import { canAccessItemShop } from '@/services/access-gate';

interface SkinDetailPageProps {
  params: Promise<{ offerId: string }>;
}

export const metadata = {
  title: 'Покупка на скин · VBucks Shop',
  description:
    'Подробности за избраната оферта от Item Shop и заявка с вашите V-Bucks.',
};

export default async function SkinDetailPage({ params }: SkinDetailPageProps) {
  // Optional auth — detail page is publicly viewable; buying requires eligibility.
  const { userId } = await auth();

  const { offerId: rawOfferId } = await params;
  const offerId = decodeURIComponent(rawOfferId);

  const profile = userId ? await getProfile(userId) : null;
  const gate = canAccessItemShop(profile);

  const entries = await fetchShopEntries();
  const entry = entries.find((e) => e.offerId === offerId);
  if (!entry) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-28 pb-16 px-4 bg-brand-dark">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/item-shop"
              data-testid="back-to-shop"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-brand-purple text-brand-text/85 hover:text-brand-text transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </Link>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
              Магазин
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 items-start">
            <div className="space-y-4 order-2 lg:order-1">
              <h1
                data-testid="skin-detail-name"
                className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-brand-text"
              >
                {entry.name}
              </h1>

              <SkinInfoCard entry={entry} />

              {gate.allowed ? (
                <BuyFlow
                  skinId={entry.offerId}
                  skinName={entry.name}
                  vbucksCost={entry.vbucks_cost}
                  regularPrice={entry.regular_price}
                  userBalance={profile!.vbucks_balance}
                />
              ) : (
                <ItemShopAccessGate gate={gate} />
              )}

              <BundleContents items={entry.bundle_items} />

              {gate.allowed && profile?.fortnite_username && (
                <p className="text-xs text-brand-muted leading-relaxed px-1">
                  Скинът ще бъде подарен ръчно в играта от администратор на
                  акаунта <strong>{profile.fortnite_username}</strong>.
                </p>
              )}
            </div>

            {/* RIGHT column — sticky hero artwork. */}
            <div className="order-1 lg:order-2 lg:sticky lg:top-28">
              <SkinHero entry={entry} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
