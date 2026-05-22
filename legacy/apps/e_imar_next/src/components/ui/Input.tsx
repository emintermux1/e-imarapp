'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftAdornment?: ReactNode;
  rightAdornment?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftAdornment, rightAdornment, className, containerClassName, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label ? (
        <label htmlFor={inputId} className="text-[13px] font-medium text-text-secondary">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border bg-bg-surface px-3 py-1.5 transition-colors',
          'focus-within:shadow-focus focus-within:border-brand-muted-blue',
          error ? 'border-state-gov-red' : 'border-border',
        )}
      >
        {leftAdornment ? <span className="text-text-muted">{leftAdornment}</span> : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'flex-1 bg-transparent text-body text-text-primary placeholder:text-text-muted outline-none',
            className,
          )}
          {...rest}
        />
        {rightAdornment ? <span className="text-text-muted">{rightAdornment}</span> : null}
      </div>
      {error ? (
        <span className="text-[12px] text-state-gov-red" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="text-[12px] text-text-muted">{hint}</span>
      ) : null}
    </div>
  );
});
