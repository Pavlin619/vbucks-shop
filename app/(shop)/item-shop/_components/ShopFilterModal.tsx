'use client';

import { useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import { labelForType } from '@/app/(shop)/item-shop/_lib/type-labels';

export interface TypeOption {
  type: string;
  count: number;
}

interface ShopFilterModalProps {
  types: TypeOption[];
  selected: string[];
  visibleCount: number;
  onToggle: (type: string) => void;
  onShowAll: () => void;
  onClear: () => void;
  onClose: () => void;
}

export default function ShopFilterModal({
  types,
  selected,
  visibleCount,
  onToggle,
  onShowAll,
  onClear,
  onClose,
}: ShopFilterModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleBackdrop(e: React.MouseEvent) {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose();
    }
  }

  const showLabel =
    selected.length === 0
      ? 'Show All Items'
      : `Show ${visibleCount} Item${visibleCount !== 1 ? 's' : ''}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={handleBackdrop}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filter shop"
        className="w-full max-w-lg bg-brand-dark rounded-2xl border border-white/10 p-6 shadow-2xl"
      >
        <h2 className="text-center text-2xl font-extrabold uppercase tracking-widest mb-6 text-brand-text">
          Filter Shop
        </h2>

        <p className="text-xs font-extrabold uppercase tracking-widest italic mb-3 text-brand-muted">
          Item Type
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mb-7">
          {types.map(({ type, count }) => {
            const checked = selected.includes(type);
            return (
              <label
                key={type}
                className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-brand-text"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(type)}
                  className="w-5 h-5 rounded border-white/30 bg-brand-purple accent-brand-accent cursor-pointer flex-shrink-0"
                />
                <span>
                  {labelForType(type)}{' '}
                  <span className="text-brand-muted">[{count}]</span>
                </span>
              </label>
            );
          })}
        </div>

        <Button
          variant="primary"
          fullWidth
          className="mb-3 font-extrabold tracking-widest uppercase"
          onClick={onShowAll}
          data-testid="filter-show-btn"
        >
          {showLabel}
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClear}
            data-testid="filter-clear-btn"
          >
            Clear
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
            data-testid="filter-close-btn"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
