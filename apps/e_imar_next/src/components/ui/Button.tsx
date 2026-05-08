'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-navy text-text-inverse hover:bg-brand-muted-blue active:bg-brand-navy disabled:bg-bg-subtle disabled:text-text-muted',
  secondary:
    'bg-bg-surface text-text-primary border border-border hover:bg-bg-subtle disabled:opacity-60',
  ghost:
    'bg-transparent text-text-primary hover:bg-bg-subtle disabled:text-text-muted',
  danger:
    'bg-state-gov-red text-white hover:opacity-90 active:opacity-100 disabled:opacity-60',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-md',
  md: 'h-10 px-4 text-body gap-2 rounded-md',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth,
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
      className={cn(
        'inline-flex items-center justify-center font-medium select-none transition-colors',
        'focus-visible:shadow-focus focus-visible:outline-none',
        'disabled:cursor-not-allowed',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
      {children ? <span>{children}</span> : null}
      {!loading && rightIcon ? rightIcon : null}
    </button>
  );
});
