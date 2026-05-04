import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SkinHero from '@/app/(shop)/item-shop/[offerId]/_components/SkinHero';
import SkinInfoCard from '@/app/(shop)/item-shop/[offerId]/_components/SkinInfoCard';
import BundleContents from '@/app/(shop)/item-shop/[offerId]/_components/BundleContents';
import BuyFlow from '@/app/(shop)/item-shop/[offerId]/_components/BuyFlow';
import { getProfile } from '@/services/wallet';
import { fetchShopEntries } from '@/services/skins';

interface SkinDetailPageProps {
  params: Promise<{ offerId: string }>;
}

export const metadata = {
  title: 'Покупка на скин · VBucks Shop',
  description:
    'Подробности за избраната оферта от Item Shop и заявка с вашите V-Bucks.',
};

export default async function SkinDetailPage({ params }: SkinDetailPageProps) {
  // Middleware already redirects unauthenticated visitors. The call here
  // is defence-in-depth and narrows `userId` to a non-null string.
  const { userId } = await auth.protect();

  const { offerId: rawOfferId } = await params;
  const offerId = decodeURIComponent(rawOfferId);

  const [profile, entries] = await Promise.all([
    getProfile(userId),
    fetchShopEntries(),
  ]);

  // No Fortnite username yet → bounce back to the catalog gate. Keeps
  // the username form in a single place.
  if (!profile.fortnite_username || profile.fortnite_username.trim() === '') {
    redirect('/item-shop');
  }

  const entry = entries.find((e) => e.offerId === offerId);
  if (!entry) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-28 pb-16 px-4 bg-brand-dark">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb — back to catalog + tiny label so the user always
              knows what surface they're on. */}
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
            {/* LEFT column — title + stacked info cards. The title sits
                above the cards so it can stretch full-width without
                getting trapped inside the description card. */}
            <div className="space-y-4 order-2 lg:order-1">
              <h1
                data-testid="skin-detail-name"
                className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-brand-text"
              >
                {entry.name}
              </h1>

              <SkinInfoCard entry={entry} />

              <BuyFlow
                skinId={entry.offerId}
                vbucksCost={entry.vbucks_cost}
                regularPrice={entry.regular_price}
                userBalance={profile.vbucks_balance}
              />

              <BundleContents items={entry.bundle_items} />

              <p className="text-xs text-brand-muted leading-relaxed px-1">
                Скинът ще бъде подарен ръчно в играта от администратор на
                акаунта <strong>{profile.fortnite_username}</strong>.
              </p>
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
