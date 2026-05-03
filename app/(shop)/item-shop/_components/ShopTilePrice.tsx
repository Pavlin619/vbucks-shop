import { formatVbucks } from '@/app/(shop)/item-shop/_lib/format';

interface ShopTilePriceProps {
  name: string;
  vbucksCost: number;
  regularPrice: number;
  isDiscounted: boolean;
}

/**
 * Bottom info strip rendered on top of every shop tile. Shows the entry name
 * plus the V-Bucks price (and the struck-through regular price when on sale).
 */
export default function ShopTilePrice({
  name,
  vbucksCost,
  regularPrice,
  isDiscounted,
}: ShopTilePriceProps) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-6"
      style={{
        // Vertical fade so the title stays readable over arbitrary artwork.
        // Kept inline because no other component needs this exact gradient.
        background:
          'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0) 100%)',
      }}
    >
      <h3
        className="text-sm font-semibold leading-tight truncate text-brand-text"
        data-testid="skin-name"
        title={name}
      >
        {name}
      </h3>

      <div className="mt-1 flex items-baseline gap-2">
        <span className="inline-flex items-center gap-1">
          {/* Inline V-Bucks token — small cyan circle with a "V". Cyan is
              not part of the brand palette; it's a Fortnite convention. */}
          <span
            aria-hidden
            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[8px] font-bold bg-cyan-400 text-brand-dark"
          >
            V
          </span>
          <span
            className="text-sm font-bold text-brand-text"
            data-testid="skin-vbucks-cost"
          >
            {formatVbucks(vbucksCost)}
          </span>
        </span>
        {isDiscounted && (
          <span
            className="text-xs line-through text-brand-text/55"
            data-testid="skin-regular-price"
          >
            {formatVbucks(regularPrice)}
          </span>
        )}
      </div>
    </div>
  );
}
