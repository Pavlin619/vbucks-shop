import type { ReactNode, HTMLAttributes } from 'react';

export type CardVariant = 'default' | 'highlight' | 'subtle';

const VARIANT_CLASSES: Record<CardVariant, string> = {
  // Plain purple panel — used inside grids and rows.
  default: 'bg-brand-purple',
  // Accent-bordered panel — used for modals, gates, and the success page.
  highlight: 'bg-brand-purple border-2 border-brand-accent',
  // Translucent border — used for the cancel page and faint dividers.
  subtle: 'bg-brand-purple border border-white/15',
};

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  variant?: CardVariant;
  /** Tailwind padding utilities (e.g. `'p-6'`, `'p-10'`). Default: `'p-6'`. */
  padding?: string;
  children: ReactNode;
}

/**
 * Recurring purple panel chrome. Variants control the border treatment
 * only — background and corner radius are fixed because they're part of
 * the brand. For one-off shape tweaks pass `className`.
 */
export default function Card({
  variant = 'default',
  padding = 'p-6',
  className,
  children,
  ...rest
}: CardProps) {
  const composed = ['rounded-2xl', VARIANT_CLASSES[variant], padding, className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div {...rest} className={composed}>
      {children}
    </div>
  );
}
