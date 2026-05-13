import Link from 'next/link';
import { CreditCard, Gift, UserPlus, ShieldAlert } from 'lucide-react';

const NAV_ITEMS = [
  { section: 'purchases', label: 'Purchases', icon: CreditCard },
  { section: 'skin-orders', label: 'Skin Orders', icon: Gift },
  { section: 'friend-requests', label: 'Friend Requests', icon: UserPlus },
  { section: 'flagged-accounts', label: 'Flagged Accounts', icon: ShieldAlert },
];

export default function AdminSideNav({ activeSection }: { activeSection: string }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ section, label, icon: Icon }) => {
        const isActive = activeSection === section;
        return (
          <Link
            key={section}
            href={`/admin?section=${section}`}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-purple text-brand-accent'
                : 'text-brand-muted hover:text-brand-text hover:bg-brand-purple/50'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
