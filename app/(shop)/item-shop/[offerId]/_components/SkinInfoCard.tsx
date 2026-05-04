import Card from '@/components/ui/Card';
import MetaPills from '@/app/(shop)/item-shop/[offerId]/_components/MetaPills';
import type { ShopEntry } from '@/types';

interface SkinInfoCardProps {
  entry: ShopEntry;
}

/**
 * Description card for a shop entry — the leftmost stacked panel on the
 * detail page. Renders the description copy when present and a row of
 * meta pills (rarity, type, discount). Intentionally narrow — the title
 * is rendered above the card so it can stretch to the column width.
 */
export default function SkinInfoCard({ entry }: SkinInfoCardProps) {
  const isDiscounted = entry.regular_price > entry.vbucks_cost;
  const vbucksSaved = isDiscounted ? entry.regular_price - entry.vbucks_cost : null;

  return (
    <Card padding="p-6" data-testid="skin-info-card">
      {entry.description && (
        <p
          data-testid="skin-detail-description"
          className="text-brand-text/85 mb-4"
        >
          {entry.description}
        </p>
      )}

      <MetaPills
        rarity={entry.rarity}
        type={entry.type}
        vbucksSaved={vbucksSaved}
      />
    </Card>
  );
}
