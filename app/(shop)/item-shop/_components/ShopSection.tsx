import type { ShopSection as ShopSectionData } from '@/types';
import ShopTile from '@/app/(shop)/item-shop/_components/ShopTile';

interface ShopSectionProps {
  section: ShopSectionData;
}

export default function ShopSection({ section }: ShopSectionProps) {
  if (section.entries.length === 0) return null;

  return (
    <section
      className="mb-12"
      data-testid="shop-section"
      data-section-name={section.layoutName}
    >
      <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide mb-4 text-brand-text">
        {section.layoutName}
      </h2>
      <div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-[minmax(0,_auto)]"
        data-testid="shop-section-grid"
      >
        {section.entries.map((entry) => (
          <ShopTile key={entry.offerId} entry={entry} />
        ))}
      </div>
    </section>
  );
}
