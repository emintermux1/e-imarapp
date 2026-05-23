'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, containerClassName, id, rows = 5, ...rest },
  ref,
) {
  const textareaId = id ?? rest.name;
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label ? (
        <label htmlFor={textareaId} className="text-[13px] font-medium text-text-secondary">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={cn(
          'rounded-md border bg-bg-surface px-3 py-2 text-body text-text-primary placeholder:text-text-muted',
          'focus:shadow-focus focus:border-brand-muted-blue focus:outline-none',
          error ? 'border-state-gov-red' : 'border-border',
          className,
        )}
        {...rest}
      />
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
