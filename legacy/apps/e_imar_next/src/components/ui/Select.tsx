'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, placeholder, className, containerClassName, id, ...rest },
  ref,
) {
  const selectId = id ?? rest.name;
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label ? (
        <label htmlFor={selectId} className="text-[13px] font-medium text-text-secondary">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          'relative flex items-center rounded-md border bg-bg-surface px-3 py-1.5 transition-colors',
          'focus-within:shadow-focus focus-within:border-brand-muted-blue',
          error ? 'border-state-gov-red' : 'border-border',
        )}
      >
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full appearance-none bg-transparent pr-6 text-body text-text-primary outline-none',
            className,
          )}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 h-4 w-4 text-text-muted"
          aria-hidden
        />
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
