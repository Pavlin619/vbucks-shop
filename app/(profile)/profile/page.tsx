import { auth, currentUser } from '@clerk/nextjs/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProfileCard from '@/app/(profile)/profile/_components/ProfileCard';
import VBucksCard from '@/app/(profile)/profile/_components/VBucksCard';
import ProfileSideNav from '@/app/(profile)/profile/_components/ProfileSideNav';
import LogoutButton from '@/app/(profile)/profile/_components/LogoutButton';
import MyOrdersPanel from '@/app/(profile)/profile/_components/MyOrdersPanel';
import FortniteAccountPanel from '@/app/(profile)/profile/_components/FortniteAccountPanel';
import { getProfile } from '@/services/wallet';
import { getAllOrders } from '@/services/orders';

export const metadata = {
  title: 'Профил · VBucks Shop',
};

const VALID_SECTIONS = ['orders', 'fortnite'] as const;
type Section = (typeof VALID_SECTIONS)[number];

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { userId } = await auth.protect();

  const [user, profile, ordersResult, params] = await Promise.all([
    currentUser(),
    getProfile(userId),
    getAllOrders(userId),
    searchParams,
  ]);

  const rawSection = params.section;
  const section: Section =
    VALID_SECTIONS.includes(rawSection as Section) ? (rawSection as Section) : 'orders';

  const displayName = user?.fullName ?? user?.firstName ?? 'Потребител';
  const initial = (user?.fullName ?? user?.firstName ?? 'П')[0].toUpperCase();
  const email = user?.emailAddresses[0]?.emailAddress ?? '';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-brand-dark pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-brand-text mb-6">Профил</h1>

          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
            <aside className="flex flex-col gap-3">
              <ProfileCard displayName={displayName} email={email} initial={initial} />
              <VBucksCard balance={profile.vbucks_balance} />
              <ProfileSideNav activeSection={section} />
              <LogoutButton />
            </aside>

            <section>
              {section === 'orders' && (
                <>
                  {ordersResult.dbError && (
                    <p className="text-sm text-rose-400 mb-4">
                      Неуспешно зареждане на поръчките. Моля, опреснете страницата.
                    </p>
                  )}
                  <MyOrdersPanel orders={ordersResult.data} />
                </>
              )}
              {section === 'fortnite' && <FortniteAccountPanel profile={profile} />}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
