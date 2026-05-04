import {
  capitalise,
  rarityTextClass,
  typeLabel,
} from '@/app/(shop)/item-shop/[offerId]/_lib/cosmetic-labels';
import { formatVbucks } from '@/app/(shop)/item-shop/_lib/format';

interface MetaPillsProps {
  rarity: string;
  type: string;
  /** V-Bucks saved compared to regular price; null if not on sale. */
  vbucksSaved: number | null;
}

/**
 * Pill row under the title: rarity, type, and (when on sale) the
 * V-Bucks-saved badge in the same yellow Epic uses on its detail page.
 *
 * The discount is shown as an absolute V-Bucks figure rather than a
 * percentage — that's what the in-game shop and the reference design from
 * fortnite-detail-mock.png surface, and it reads better than "25% OFF" for
 * the Fortnite audience.
 */
export default function MetaPills({ rarity, type, vbucksSaved }: MetaPillsProps) {
  return (
    <div
      data-testid="meta-pills"
      className="flex flex-wrap items-center gap-2"
    >
      <span
        data-testid="meta-pill-rarity"
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-dark/60 ${rarityTextClass(
          rarity,
        )}`}
      >
        {capitalise(rarity)}
      </span>

      <span
        data-testid="meta-pill-type"
        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-dark/60 text-brand-text"
      >
        {typeLabel(type)}
      </span>

      {vbucksSaved !== null && vbucksSaved > 0 && (
        <span
          data-testid="meta-pill-discount"
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-yellow-300 text-brand-dark"
        >
          {formatVbucks(vbucksSaved)} V-Bucks отстъпка
        </span>
      )}
    </div>
  );
}
