import Link from 'next/link';
import { ShoppingBag, Gamepad2 } from 'lucide-react';

const NAV_ITEMS = [
  { section: 'orders', label: 'Моите поръчки', icon: ShoppingBag },
  { section: 'fortnite', label: 'Fortnite акаунт', icon: Gamepad2 },
];

export default function ProfileSideNav({ activeSection }: { activeSection: string }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ section, label, icon: Icon }) => {
        const isActive = activeSection === section;
        return (
          <Link
            key={section}
            href={`/profile?section=${section}`}
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
