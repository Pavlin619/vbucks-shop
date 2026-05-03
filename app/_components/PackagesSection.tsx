'use client';

import { useState } from 'react';
import { VBUCKS_PACKS } from '@/lib/vbucks-packs';
import { useCart } from '@/contexts/CartContext';
import type { VBucksPack } from '@/types';
import SectionHeading from '@/components/ui/SectionHeading';
import PackageCard from '@/app/_components/PackageCard';
import AddedToCartModal from '@/app/_components/AddedToCartModal';

/**
 * Grid of V-Bucks packs on the home page. Owns the small piece of state
 * needed to surface the "added to cart" confirmation modal — the visuals
 * for the card and modal live in dedicated sub-components.
 */
export default function PackagesSection() {
  const { addItem } = useCart();
  const [addedPack, setAddedPack] = useState<VBucksPack | null>(null);

  function handleBuy(pack: VBucksPack) {
    addItem(pack.id);
    setAddedPack(pack);
  }

  return (
    <section id="packages" className="py-20 px-4 bg-brand-dark">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          title="Изберете Вашия Пакет"
          subtitle="Изберете перфектната сума за вашите гейминг нужди"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {Object.values(VBUCKS_PACKS).map((pack) => (
            <PackageCard key={pack.id} pack={pack} onBuy={handleBuy} />
          ))}
        </div>
      </div>

      {addedPack && (
        <AddedToCartModal pack={addedPack} onClose={() => setAddedPack(null)} />
      )}
    </section>
  );
}
