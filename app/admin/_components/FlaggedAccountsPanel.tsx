import type { FlaggedAccount } from '@/services/admin';

export default function FlaggedAccountsPanel({
  accounts,
}: {
  accounts: FlaggedAccount[];
}) {
  if (accounts.length === 0) {
    return <p className="text-brand-muted text-sm py-4">No flagged accounts.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-brand-border text-xs uppercase tracking-wider text-brand-muted">
            <th className="pb-3 pr-6">User ID</th>
            <th className="pb-3 pr-6">Fortnite Username</th>
            <th className="pb-3">Phone</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.user_id} className="border-b border-rose-500/20 bg-rose-500/5">
              <td className="py-3 pr-6 font-mono text-xs text-brand-muted">{account.user_id}</td>
              <td className="py-3 pr-6 text-sm text-brand-text">
                {account.fortnite_username ?? <span className="italic text-brand-muted">Not set</span>}
              </td>
              <td className="py-3 text-sm text-brand-muted">
                {account.phone_number ?? <span className="italic">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
