'use client';

import { useState, useTransition } from 'react';
import type { FriendRequestEntry, FriendRequestStatus } from '@/types';

const ROW_CLASSES: Record<FriendRequestStatus, string> = {
  not_sent: 'border-b border-rose-500/20 bg-rose-500/5',
  pending: 'border-b border-amber-500/30 bg-amber-500/5',
  accepted: 'border-b border-green-500/30 bg-green-500/5',
};

const NEXT: Partial<Record<FriendRequestStatus, FriendRequestStatus>> = {
  not_sent: 'pending',
  pending: 'accepted',
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

export default function FriendRequestRow({ entry }: { entry: FriendRequestEntry }) {
  const [status, setStatus] = useState<FriendRequestStatus>(entry.friend_request_status);
  const [transitioning, startTransition] = useTransition();

  async function advance() {
    const next = NEXT[status];
    if (!next || transitioning) return;
    const previous = status;
    setStatus(next);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/profiles/${entry.user_id}/friend-request`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        });
        if (!res.ok) setStatus(previous);
      } catch {
        setStatus(previous);
      }
    });
  }

  return (
    <tr
      data-testid={`friend-request-row-${entry.user_id}`}
      className={`${ROW_CLASSES[status]} transition-colors`}
    >
      <td className="py-3 pr-6 font-mono text-sm text-brand-text">{entry.fortnite_username}</td>
      <td className="py-3 pr-6 text-sm text-brand-muted">
        {entry.email ?? <span className="italic">—</span>}
      </td>
      <td className="py-3 pr-6 text-sm text-brand-muted">
        {entry.phone_number ?? <span className="italic">—</span>}
      </td>
      <td className="py-3 pr-6 text-sm text-brand-muted">
        {entry.username_set_at ? formatDate(entry.username_set_at) : <span className="italic">—</span>}
      </td>
      <td className="py-3 text-sm whitespace-nowrap min-w-[180px]">
        {status === 'not_sent' && (
          <button
            type="button"
            onClick={advance}
            disabled={transitioning}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              'bg-brand-accent/20 text-brand-accent hover:bg-brand-accent/30',
              transitioning ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            Sent Friend Request →
          </button>
        )}
        {status === 'pending' && (
          <button
            type="button"
            onClick={advance}
            disabled={transitioning}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              'bg-green-500/20 text-green-400 hover:bg-green-500/30',
              transitioning ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            Accepted by User →
          </button>
        )}
        {status === 'accepted' && (
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 text-green-400">
            ✓ Friends
          </span>
        )}
      </td>
    </tr>
  );
}
