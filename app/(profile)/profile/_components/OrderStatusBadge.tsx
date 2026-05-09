import type { OrderStatus } from '@/types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Изчаква', className: 'bg-amber-500/20 text-amber-400' },
  gifted: { label: 'Подарен', className: 'bg-green-500/20 text-green-400' },
  refunded: { label: 'Възстановен', className: 'bg-rose-500/20 text-rose-400' },
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
