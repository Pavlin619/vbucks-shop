import Image from 'next/image';
import Link from 'next/link';
import type { ShopEntry } from '@/types';
import { FALLBACK_COLORS, tileLayout } from '@/app/(shop)/item-shop/_lib/tile-size';
import { discountPercent } from '@/app/(shop)/item-shop/_lib/format';
import ShopTilePrice from '@/app/(shop)/item-shop/_components/ShopTilePrice';

interface ShopTileProps {
  entry: ShopEntry;
}

export default function ShopTile({ entry }: ShopTileProps) {
  const isDiscounted = entry.regular_price > entry.vbucks_cost;
  const discount = discountPercent(entry.regular_price, entry.vbucks_cost);

  const { span, aspect } = tileLayout(entry.tile_size);

  // Diagonal gradient sourced from the API — mirrors Epic's per-tile theming.
  // This is the canonical case for inline `style`: the value is computed from
  // runtime data the bundler can't see. We tolerate entries missing the
  // colors block (older cache shape, or layouts the upstream API doesn't
  // theme) without crashing the page.
  const colors = entry.colors ?? FALLBACK_COLORS;
  const background = `linear-gradient(135deg, ${colors.color1} 0%, ${colors.color3} 100%)`;

  // The offerId carries `:` and `/` (e.g. `v2:/abc...`) which would break
  // the dynamic segment if passed raw. Encode once at the boundary.
  const detailHref = `/item-shop/${encodeURIComponent(entry.offerId)}`;

  return (
    <Link
      href={detailHref}
      className={`group relative rounded-2xl overflow-hidden transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent ${span}`}
      style={{ background }}
      data-testid="skin-card"
      data-offer-id={entry.offerId}
      data-tile-size={entry.tile_size}
      aria-label={`${entry.name} — ${entry.vbucks_cost} V-Bucks`}
    >
      <div className={`relative w-full ${aspect}`}>
        <Image
          src={entry.image_url}
          alt={entry.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain object-bottom"
          unoptimized
        />

        {isDiscounted && (
          <span
            className="absolute bottom-2 left-3 text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded bg-black text-brand-text"
            data-testid="skin-discount-badge"
          >
            {discount ? `${discount}% OFF` : 'SALE'}
          </span>
        )}
      </div>

      <ShopTilePrice
        name={entry.name}
        vbucksCost={entry.vbucks_cost}
        regularPrice={entry.regular_price}
        isDiscounted={isDiscounted}
      />
    </Link>
  );
}
