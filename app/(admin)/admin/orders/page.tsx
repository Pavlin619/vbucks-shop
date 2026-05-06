import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import PurchasersPanel from './_components/PurchasersPanel';
import SkinOrdersPanel from './_components/SkinOrdersPanel';
import { getRecentVBucksPurchasers } from '@/services/admin';
import { getPendingOrders } from '@/services/orders';

export const metadata = {
  title: 'Admin — Orders · VBucks Shop',
};

const VALID_PAGE_SIZES = [10, 20, 50] as const;

function getAdminUserIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const { userId } = await auth.protect();

  if (!getAdminUserIds().includes(userId)) {
    redirect('/');
  }

  const { page: rawPage, pageSize: rawSize } = await searchParams;
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1);
  const pageSize = VALID_PAGE_SIZES.includes(parseInt(rawSize ?? '', 10) as (typeof VALID_PAGE_SIZES)[number])
    ? parseInt(rawSize!, 10)
    : 20;

  const [{ data: purchasers, total }, pendingOrders] = await Promise.all([
    getRecentVBucksPurchasers({ page, pageSize }),
    getPendingOrders(),
  ]);

  return (
    <>
      <Header />
      <main className="min-h-screen pt-28 pb-16 px-4 bg-brand-dark">
        <div className="max-w-7xl mx-auto space-y-10">
          <div>
            <h1 className="text-4xl font-extrabold uppercase tracking-tight text-brand-text mb-1">
              Admin Dashboard
            </h1>
            <p className="text-brand-muted text-sm">
              Manage V-Bucks purchases, friend requests, and skin order fulfilment.
            </p>
          </div>

          <Card variant="default">
            <h2 className="text-xl font-bold text-brand-text mb-6">V-Bucks Purchases</h2>
            <PurchasersPanel
              purchasers={purchasers}
              total={total}
              page={page}
              pageSize={pageSize}
            />
          </Card>

          <Card variant="default">
            <h2 className="text-xl font-bold text-brand-text mb-2">Pending Skin Orders</h2>
            <p className="text-brand-muted text-xs mb-6">
              Gift each item in-game via Fortnite, then mark as gifted. Use Refund to credit
              the V-Bucks back if you cannot fulfil the order.
            </p>
            <SkinOrdersPanel orders={pendingOrders} />
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
