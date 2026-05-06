'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface PaginationControlsProps {
  total: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZES = [10, 20, 50] as const;

export default function PaginationControls({ total, page, pageSize }: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function navigate(newPage: number, newPageSize: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    params.set('pageSize', String(newPageSize));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-brand-border/40">
      <div className="flex items-center gap-2">
        <span className="text-xs text-brand-muted">Per page:</span>
        {PAGE_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => navigate(1, size)}
            className={[
              'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
              size === pageSize
                ? 'bg-brand-accent/20 text-brand-accent'
                : 'text-brand-muted hover:text-brand-text',
            ].join(' ')}
          >
            {size}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 text-xs text-brand-muted">
        <span>{total} total</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate(page - 1, pageSize)}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg font-medium bg-brand-purple text-brand-muted hover:text-brand-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>
          <span className="px-3 py-1.5 text-brand-text">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => navigate(page + 1, pageSize)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg font-medium bg-brand-purple text-brand-muted hover:text-brand-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
