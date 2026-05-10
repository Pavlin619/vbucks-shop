import type { SkinOrderWithUsername } from '@/types';
import OrderRow from './OrderRow';

interface SkinOrdersPanelProps {
  orders: SkinOrderWithUsername[];
}

export default function SkinOrdersPanel({ orders }: SkinOrdersPanelProps) {
  if (orders.length === 0) {
    return <p className="text-brand-muted text-sm py-4">No pending skin orders.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-brand-border text-brand-muted text-left">
            <th className="py-3 pr-6 font-medium">Fortnite Username</th>
            <th className="py-3 pr-6 font-medium">Email</th>
            <th className="py-3 pr-6 font-medium">Phone</th>
            <th className="py-3 pr-6 font-medium">Skin</th>
            <th className="py-3 pr-6 font-medium">V-Bucks</th>
            <th className="py-3 pr-6 font-medium">Ordered</th>
            <th className="py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
