import type { FriendRequestEntry } from '@/types';
import FriendRequestRow from './FriendRequestRow';

export default function FriendRequestsPanel({ entries }: { entries: FriendRequestEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-brand-muted text-sm py-4">
        No Fortnite usernames set yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-brand-border text-brand-muted text-left">
            <th className="py-3 pr-6 font-medium">Fortnite Username</th>
            <th className="py-3 pr-6 font-medium">Email</th>
            <th className="py-3 pr-6 font-medium">Phone</th>
            <th className="py-3 pr-6 font-medium">Username Set</th>
            <th className="py-3 font-medium">Friend Request</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <FriendRequestRow key={e.user_id} entry={e} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
