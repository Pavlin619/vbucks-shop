import Image from 'next/image';
import type { ShopEntry } from '@/types';
import { FALLBACK_COLORS } from '@/app/(shop)/item-shop/_lib/tile-size';

interface SkinHeroProps {
  entry: ShopEntry;
}

/**
 * Big artwork panel shown on the right side of the detail page. Uses the
 * same per-entry gradient backdrop as the shop tiles so a buyer's eye
 * tracks naturally from the tile they clicked into the detail view.
 *
 * Inline `style` is the canonical good case here: the gradient is computed
 * from runtime API data the bundler can't see (per AGENTS.md styling rules).
 */
export default function SkinHero({ entry }: SkinHeroProps) {
  const colors = entry.colors ?? FALLBACK_COLORS;
  const background = `linear-gradient(135deg, ${colors.color1} 0%, ${colors.color3} 100%)`;

  return (
    <div
      data-testid="skin-detail-hero"
      className="relative w-full aspect-[4/5] sm:aspect-[3/4] lg:aspect-[3/4] rounded-3xl overflow-hidden shadow-xl"
      style={{ background }}
    >
      <Image
        src={entry.image_url}
        alt={entry.name}
        fill
        sizes="(max-width: 1024px) 100vw, 40vw"
        className="object-contain object-bottom"
        priority
      />
    </div>
  );
}
