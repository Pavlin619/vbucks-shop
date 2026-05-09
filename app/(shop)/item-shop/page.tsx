import { auth } from '@clerk/nextjs/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ShopGrid from '@/app/(shop)/item-shop/_components/ShopGrid';
import ItemShopAccessGate from '@/app/(shop)/item-shop/_components/ItemShopAccessGate';
import { getProfile } from '@/services/wallet';
import { fetchShopEntries } from '@/services/skins';
import { canAccessItemShop } from '@/services/access-gate';

export const metadata = {
  title: 'Item Shop · VBucks Shop',
  description: 'Днешният Fortnite Item Shop — скинове, бъндъли и аксесоари с реални V-Bucks цени.',
};

export default async function ItemShopPage() {
  // Optional auth — item shop is publicly browsable.
  const { userId } = await auth();

  const profile = userId ? await getProfile(userId) : null;
  const gate = canAccessItemShop(profile);

  const entries = await fetchShopEntries();

  return (
    <>
      <Header />
      <main className="min-h-screen pt-28 pb-16 px-4 bg-brand-dark">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-tight mb-2 text-brand-text">
              Item Shop
            </h1>
            <p className="text-brand-muted max-w-2xl">
              Каталогът се обновява всеки ден директно от магазина на Fortnite. Изберете оферта
              и я заявете с вашите V-Bucks — администратор ще ви я подари в играта.
            </p>
          </div>

          {!gate.allowed && <ItemShopAccessGate gate={gate} className="mb-8" />}

          <ShopGrid entries={entries} />
        </div>
      </main>
      <Footer />
    </>
  );
}
