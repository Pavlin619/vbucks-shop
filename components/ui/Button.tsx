import Link from 'next/link';
import type { ReactNode, ComponentPropsWithoutRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Solid red CTA — the default for "buy", "checkout", "go to cart" etc.
  primary:
    'bg-brand-accent text-brand-text hover:bg-brand-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent',
  // Outlined dark pill — used for "continue shopping" / cancel-style actions.
  secondary:
    'bg-brand-dark text-brand-text border border-white/20 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-text',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = CommonProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof CommonProps> & {
    as?: 'button';
  };

type ButtonAsLink = CommonProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof CommonProps> & {
    as: 'link';
    href: ComponentPropsWithoutRef<typeof Link>['href'];
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function composeClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  extra: string | undefined,
): string {
  return [
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth ? 'w-full' : '',
    extra ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Single source of truth for every CTA in the app. Renders as a `<button>`
 * by default; pass `as="link"` and `href` to render a Next.js `<Link>`
 * with the same styling.
 *
 * Variants and sizes are picked from constants — adding a new variant
 * should be a one-line entry in `VARIANT_CLASSES` so the design system
 * stays grep-able. All extra DOM props (`data-testid`, `aria-label`,
 * `disabled`, `onClick`, etc.) pass through to the underlying element.
 */
export default function Button(props: ButtonProps) {
  if (props.as === 'link') {
    const {
      as: _as,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      className,
      children,
      ...rest
    } = props;
    void _as;
    return (
      <Link {...rest} className={composeClasses(variant, size, fullWidth, className)}>
        {children}
      </Link>
    );
  }

  const {
    as: _as,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className,
    children,
    ...rest
  } = props;
  void _as;
  return (
    <button {...rest} className={composeClasses(variant, size, fullWidth, className)}>
      {children}
    </button>
  );
}
