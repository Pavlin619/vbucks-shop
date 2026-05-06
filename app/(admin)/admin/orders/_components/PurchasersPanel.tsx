import { Suspense } from 'react';
import type { PurchaserWithStatus } from '@/types';
import PurchaserRow from './PurchaserRow';
import PaginationControls from './PaginationControls';

interface PurchasersPanelProps {
  purchasers: PurchaserWithStatus[];
  total: number;
  page: number;
  pageSize: number;
}

export default function PurchasersPanel({
  purchasers,
  total,
  page,
  pageSize,
}: PurchasersPanelProps) {
  if (purchasers.length === 0 && page === 1) {
    return <p className="text-brand-muted text-sm py-4">No V-Bucks purchases yet.</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-brand-border text-brand-muted text-left">
              <th className="py-3 pr-6 font-medium">Fortnite Username</th>
              <th className="py-3 pr-6 font-medium">V-Bucks</th>
              <th className="py-3 pr-6 font-medium">Purchased</th>
              <th className="py-3 font-medium">Friend Request</th>
            </tr>
          </thead>
          <tbody>
            {purchasers.map((p) => (
              <PurchaserRow key={p.purchase_id} purchaser={p} />
            ))}
          </tbody>
        </table>
      </div>
      {/* Suspense required because PaginationControls calls useSearchParams() */}
      <Suspense>
        <PaginationControls total={total} page={page} pageSize={pageSize} />
      </Suspense>
    </div>
  );
}
