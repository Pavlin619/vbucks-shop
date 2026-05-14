'use client';

import { useState, useMemo } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import ShopSection from '@/app/(shop)/item-shop/_components/ShopSection';
import ShopFilterModal from '@/app/(shop)/item-shop/_components/ShopFilterModal';
import EmptyState from '@/components/ui/EmptyState';
import type { ShopSection as ShopSectionData } from '@/types';

interface ShopGridClientProps {
  sections: ShopSectionData[];
}

export default function ShopGridClient({ sections }: ShopGridClientProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const typeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const section of sections) {
      for (const entry of section.entries) {
        counts.set(entry.type, (counts.get(entry.type) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [sections]);

  const filteredSections = useMemo(() => {
    if (selectedTypes.length === 0) return sections;
    return sections
      .map((s) => ({ ...s, entries: s.entries.filter((e) => selectedTypes.includes(e.type)) }))
      .filter((s) => s.entries.length > 0);
  }, [sections, selectedTypes]);

  const visibleCount = filteredSections.reduce((n, s) => n + s.entries.length, 0);
  const hasFilter = selectedTypes.length > 0;

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  function clearFilters() {
    setSelectedTypes([]);
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setFilterOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-purple border border-white/15 text-sm font-semibold text-brand-text hover:bg-white/10 transition-colors"
          aria-label="Open filters"
          data-testid="filter-open-btn"
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          Filters
          {hasFilter && (
            <span className="min-w-[1.25rem] h-5 flex items-center justify-center rounded-full bg-brand-accent text-xs font-bold px-1">
              {selectedTypes.length}
            </span>
          )}
        </button>

        {hasFilter && (
          <button
            onClick={clearFilters}
            className="text-sm text-brand-muted hover:text-brand-text transition-colors"
            data-testid="filter-clear-inline-btn"
          >
            Clear filters
          </button>
        )}
      </div>

      {filteredSections.length === 0 ? (
        <EmptyState
          message="No items match the selected filters."
          testId="shop-filtered-empty"
        />
      ) : (
        <div data-testid="shop-grid">
          {filteredSections.map((section) => (
            <ShopSection key={section.layoutName} section={section} />
          ))}
        </div>
      )}

      {filterOpen && (
        <ShopFilterModal
          types={typeOptions}
          selected={selectedTypes}
          visibleCount={visibleCount}
          onToggle={toggleType}
          onShowAll={() => setFilterOpen(false)}
          onClear={clearFilters}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </>
  );
}
