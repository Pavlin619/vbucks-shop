import type { ReactNode } from 'react';

interface SectionHeadingProps {
  title: ReactNode;
  subtitle?: ReactNode;
  align?: 'center' | 'left';
  className?: string;
}

/**
 * Marketing-page section header: large title + optional subtitle. Used by
 * every block on the home page so spacing and typography stay consistent.
 */
export default function SectionHeading({
  title,
  subtitle,
  align = 'center',
  className,
}: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'text-center' : 'text-left';
  const wrapperClass = [alignClass, subtitle ? 'mb-12' : 'mb-16', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      <h2 className="text-4xl font-bold text-brand-text mb-4">{title}</h2>
      {subtitle && <p className="text-brand-muted text-lg">{subtitle}</p>}
    </div>
  );
}
