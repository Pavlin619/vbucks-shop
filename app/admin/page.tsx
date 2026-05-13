import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import PurchasersPanel from './_components/PurchasersPanel';
import SkinOrdersPanel from './_components/SkinOrdersPanel';
import FriendRequestsPanel from './_components/FriendRequestsPanel';
import FlaggedAccountsPanel from './_components/FlaggedAccountsPanel';
import AdminSideNav from './_components/AdminSideNav';
import { getRecentVBucksPurchasers, getFriendRequestQueue, getFailedNotificationsCount, getFlaggedAccounts } from '@/services/admin';
import { getPendingOrders } from '@/services/orders';

export const metadata = {
  title: 'Admin · VBucks Shop',
};

const VALID_SECTIONS = ['purchases', 'skin-orders', 'friend-requests', 'flagged-accounts'] as const;
type Section = (typeof VALID_SECTIONS)[number];

const VALID_PAGE_SIZES = [10, 20, 50] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; page?: string; pageSize?: string }>;
}) {
  const { sessionClaims } = await auth.protect();

  if (sessionClaims?.metadata?.role !== 'admin') {
    redirect('/');
  }

  const { section: rawSection, page: rawPage, pageSize: rawSize } = await searchParams;

  const section: Section =
    VALID_SECTIONS.includes(rawSection as Section) ? (rawSection as Section) : 'purchases';

  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1);
  const pageSize = VALID_PAGE_SIZES.includes(
    parseInt(rawSize ?? '', 10) as (typeof VALID_PAGE_SIZES)[number],
  )
    ? parseInt(rawSize!, 10)
    : 20;

  const [purchasersResult, pendingOrdersResult, friendRequestsResult, failedNotifCount, flaggedAccountsResult] =
    await Promise.all([
      getRecentVBucksPurchasers({ page, pageSize }),
      getPendingOrders(),
      getFriendRequestQueue(),
      getFailedNotificationsCount(),
      getFlaggedAccounts(),
    ]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-brand-dark pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-brand-text mb-6">Admin Dashboard</h1>

          {failedNotifCount > 0 && (
            <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              <span className="font-semibold">{failedNotifCount} email notification{failedNotifCount > 1 ? 's' : ''} failed to send.</span>{' '}
              Check the <code className="text-xs">failed_notifications</code> table and resend manually if needed.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
            <aside className="flex flex-col gap-3">
              <Card variant="subtle" padding="p-4">
                <p className="text-xs text-brand-muted uppercase tracking-widest font-semibold mb-0.5">
                  Admin Panel
                </p>
                <p className="text-sm text-brand-text font-bold">Orders & Fulfilment</p>
              </Card>
              <AdminSideNav activeSection={section} />
            </aside>

            <section>
              {section === 'purchases' && (
                <Card variant="default">
                  <h2 className="text-xl font-bold text-brand-text mb-6">V-Bucks Purchases</h2>
                  {purchasersResult.dbError && (
                    <p className="text-sm text-rose-400 mb-4">
                      Failed to load purchases. Please refresh.
                    </p>
                  )}
                  <PurchasersPanel
                    purchasers={purchasersResult.data}
                    total={purchasersResult.total}
                    page={page}
                    pageSize={pageSize}
                  />
                </Card>
              )}

              {section === 'skin-orders' && (
                <Card variant="default">
                  <h2 className="text-xl font-bold text-brand-text mb-2">Pending Skin Orders</h2>
                  <p className="text-brand-muted text-xs mb-6">
                    Gift each item in-game via Fortnite, then mark as gifted. Use Refund to credit
                    the V-Bucks back if you cannot fulfil the order.
                  </p>
                  {pendingOrdersResult.dbError && (
                    <p className="text-sm text-rose-400 mb-4">
                      Failed to load orders. Please refresh.
                    </p>
                  )}
                  <SkinOrdersPanel orders={pendingOrdersResult.data} />
                </Card>
              )}

              {section === 'friend-requests' && (
                <Card variant="default">
                  <h2 className="text-xl font-bold text-brand-text mb-2">Friend Requests</h2>
                  <p className="text-brand-muted text-xs mb-6">
                    Customers who have set a Fortnite username. Send them a friend request in-game
                    so they can receive gifted skins.
                  </p>
                  {friendRequestsResult.dbError && (
                    <p className="text-sm text-rose-400 mb-4">
                      Failed to load friend requests. Please refresh.
                    </p>
                  )}
                  <FriendRequestsPanel entries={friendRequestsResult.data} />
                </Card>
              )}

              {section === 'flagged-accounts' && (
                <Card variant="default">
                  <h2 className="text-xl font-bold text-brand-text mb-2">Flagged Accounts</h2>
                  <p className="text-brand-muted text-xs mb-6">
                    Accounts flagged due to Stripe chargebacks or disputes. Review and take manual
                    action as needed.
                  </p>
                  {flaggedAccountsResult.dbError && (
                    <p className="text-sm text-rose-400 mb-4">
                      Failed to load flagged accounts. Please refresh.
                    </p>
                  )}
                  <FlaggedAccountsPanel accounts={flaggedAccountsResult.data} />
                </Card>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
