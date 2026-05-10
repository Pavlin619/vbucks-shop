import type { FriendRequestStatus, PurchaserWithStatus } from '@/types';

const FRIEND_REQUEST_BADGE: Record<FriendRequestStatus, { label: string; className: string }> = {
  not_sent: { label: 'Not Sent', className: 'bg-rose-500/20 text-rose-400' },
  pending: { label: 'Pending', className: 'bg-amber-500/20 text-amber-400' },
  accepted: { label: 'Friends', className: 'bg-green-500/20 text-green-400' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PurchaserRow({ purchaser }: { purchaser: PurchaserWithStatus }) {
  const badge = FRIEND_REQUEST_BADGE[purchaser.friend_request_status];

  return (
    <tr className="border-b border-brand-border hover:bg-brand-purple/20 transition-colors">
      <td className="py-3 pr-6 font-mono text-sm text-brand-text">
        {purchaser.fortnite_username ?? (
          <span className="text-brand-muted italic">Not set</span>
        )}
      </td>
      <td className="py-3 pr-6 text-sm text-brand-muted">
        {purchaser.email ?? <span className="italic">—</span>}
      </td>
      <td className="py-3 pr-6 text-sm text-brand-muted">
        {purchaser.phone_number ?? <span className="italic">—</span>}
      </td>
      <td className="py-3 pr-6 text-sm text-brand-text">
        {purchaser.vbucks_amount.toLocaleString()}
      </td>
      <td className="py-3 pr-6 text-sm text-brand-muted">{formatDate(purchaser.purchased_at)}</td>
      <td className="py-3 pr-6">
        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-400">
          Paid
        </span>
      </td>
      <td className="py-3">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${badge.className}`}>
          {badge.label}
        </span>
      </td>
    </tr>
  );
}
