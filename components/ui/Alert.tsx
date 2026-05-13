import type { ReactNode, HTMLAttributes } from 'react';

export type AlertVariant = 'error' | 'warning' | 'info' | 'success';

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  // Brand-accent tinted panel — same palette as the buy CTA, so error states
  // visually rhyme with the "danger" affordance the user is already used to.
  error: 'bg-brand-accent/10 border border-brand-border-strong text-brand-text',
  // Amber matches the admin "pending" rows and the checkout success warning.
  warning: 'bg-amber-500/10 border border-amber-500/40 text-brand-text',
  // Translucent white border — neutral; pairs well with the dark page bg.
  info: 'bg-white/5 border border-white/15 text-brand-text',
  // Green echoes the admin "gifted" badge and the checkout success card.
  success: 'bg-green-500/10 border border-green-500/40 text-brand-text',
};

const IS_ASSERTIVE: Record<AlertVariant, boolean> = {
  error: true,
  warning: true,
  info: false,
  success: false,
};

interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role'> {
  variant?: AlertVariant;
  /** Optional action slot, typically a `<Button size="sm">`. Rendered on the right. */
  action?: ReactNode;
  children: ReactNode;
}

export default function Alert({
  variant = 'info',
  action,
  className,
  children,
  ...rest
}: AlertProps) {
  const composed = [
    'rounded-xl px-4 py-3 text-sm flex items-start gap-3',
    VARIANT_CLASSES[variant],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      {...rest}
      role={IS_ASSERTIVE[variant] ? 'alert' : 'status'}
      className={composed}
    >
      <div className="flex-1">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
