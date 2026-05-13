import EmptyState from '@/components/ui/EmptyState';
import ShopSection from '@/app/(shop)/item-shop/_components/ShopSection';
import ShopRefreshButton from '@/app/(shop)/item-shop/_components/ShopRefreshButton';
import { groupByLayout } from '@/services/skins';
import type { ShopEntry } from '@/types';

interface ShopGridProps {
  entries: ShopEntry[];
}

export default function ShopGrid({ entries }: ShopGridProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        message="Магазинът на Fortnite временно не е достъпен. Опитайте отново след малко."
        testId="shop-empty"
        action={<ShopRefreshButton />}
      />
    );
  }

  const sections = groupByLayout(entries);

  return (
    <div data-testid="shop-grid">
      {sections.map((section) => (
        <ShopSection key={section.layoutName} section={section} />
      ))}
    </div>
  );
}
