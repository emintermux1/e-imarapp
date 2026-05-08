'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type IconButtonVariant = 'ghost' | 'solid' | 'subtle';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  active?: boolean;
  children: ReactNode;
}

const SIZE: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
};

const VARIANT: Record<IconButtonVariant, string> = {
  ghost: 'bg-transparent text-text-secondary hover:bg-bg-subtle hover:text-text-primary',
  solid:
    'bg-brand-navy text-text-inverse hover:bg-brand-muted-blue disabled:bg-bg-subtle disabled:text-text-muted',
  subtle: 'bg-bg-subtle text-text-primary hover:bg-border-subtle border border-border-subtle',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    variant = 'ghost',
    size = 'md',
    loading,
    active,
    disabled,
    children,
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      data-active={active ? 'true' : undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-colors',
        'focus-visible:shadow-focus focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-60',
        SIZE[size],
        VARIANT[variant],
        active && 'bg-bg-subtle text-text-primary ring-1 ring-border',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : children}
    </button>
  );
});
