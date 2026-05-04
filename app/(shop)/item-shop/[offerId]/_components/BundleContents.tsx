import Image from 'next/image';
import Card from '@/components/ui/Card';
import type { BundleItem } from '@/types';
import {
  capitalise,
  rarityTextClass,
  typeLabel,
} from '@/app/(shop)/item-shop/[offerId]/_lib/cosmetic-labels';

interface BundleContentsProps {
  items: BundleItem[];
}

/**
 * Lists every cosmetic that ships inside a bundle offer (outfit + glider +
 * pickaxe + …). Returns `null` for non-bundle entries so the parent doesn't
 * have to guard. Each row shows the icon, the name, and a type/rarity chip
 * pair so the buyer can see exactly what they're getting before paying.
 */
export default function BundleContents({ items }: BundleContentsProps) {
  if (items.length === 0) return null;

  return (
    <Card padding="p-6" data-testid="bundle-contents">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-accent mb-4">
        Съдържание на пакета
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            data-testid="bundle-item"
            data-bundle-item-id={item.id}
            className="flex items-center gap-3 rounded-xl px-3 py-2 bg-brand-dark/60"
          >
            <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-brand-dark">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  sizes="40px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div
                  aria-hidden
                  className="flex items-center justify-center w-full h-full text-xs font-bold text-brand-muted"
                >
                  ?
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-text truncate">
                {item.name}
              </p>
              <p className="text-xs text-brand-muted">
                <span data-testid="bundle-item-type">{typeLabel(item.type)}</span>
                <span aria-hidden> · </span>
                <span
                  data-testid="bundle-item-rarity"
                  className={rarityTextClass(item.rarity)}
                >
                  {capitalise(item.rarity)}
                </span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
