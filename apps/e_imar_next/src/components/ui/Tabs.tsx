'use client';

import {
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

export interface TabItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  /** Optional badge text shown after the label. */
  badge?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  className?: string;
  variant?: 'pills' | 'underline';
  size?: 'sm' | 'md';
}

export function Tabs({
  items,
  value,
  onChange,
  ariaLabel,
  className,
  variant = 'underline',
  size = 'md',
}: TabsProps) {
  const tablistId = useId();
  const [focusedIndex, setFocusedIndex] = useState(() =>
    Math.max(0, items.findIndex((item) => item.id === value)),
  );
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    const idx = items.findIndex((item) => item.id === value);
    if (idx >= 0) setFocusedIndex(idx);
  }, [value, items]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const enabledIndexes = items.flatMap((item, idx) => (item.disabled ? [] : [idx]));
      if (enabledIndexes.length === 0) return;
      const currentEnabledIdx = enabledIndexes.indexOf(focusedIndex);
      let nextEnabledIdx = currentEnabledIdx;
      if (event.key === 'ArrowLeft') {
        nextEnabledIdx = (currentEnabledIdx - 1 + enabledIndexes.length) % enabledIndexes.length;
      } else if (event.key === 'ArrowRight') {
        nextEnabledIdx = (currentEnabledIdx + 1) % enabledIndexes.length;
      } else if (event.key === 'Home') {
        nextEnabledIdx = 0;
      } else if (event.key === 'End') {
        nextEnabledIdx = enabledIndexes.length - 1;
      }
      const target = enabledIndexes[nextEnabledIdx];
      setFocusedIndex(target);
      buttonsRef.current[target]?.focus();
      onChange(items[target].id);
    },
    [focusedIndex, items, onChange],
  );

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'relative flex items-stretch gap-1 overflow-x-auto scroll-thin',
        variant === 'underline' && 'border-b border-border-subtle',
        className,
      )}
      id={tablistId}
    >
      {items.map((item, index) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            ref={(node) => {
              buttonsRef.current[index] = node;
            }}
            role="tab"
            type="button"
            id={`${tablistId}-tab-${item.id}`}
            aria-selected={active}
            aria-controls={`${tablistId}-panel-${item.id}`}
            tabIndex={active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => !item.disabled && onChange(item.id)}
            onKeyDown={onKeyDown}
            className={cn(
              'relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors',
              'focus-visible:shadow-focus focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-body',
              variant === 'pills' &&
                cn(
                  'rounded-md',
                  active
                    ? 'bg-brand-navy text-text-inverse'
                    : 'text-text-secondary hover:bg-bg-subtle hover:text-text-primary',
                ),
              variant === 'underline' &&
                cn(
                  active ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary',
                ),
            )}
          >
            {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
            <span>{item.label}</span>
            {item.badge ? (
              <span className="ml-1 rounded-sm bg-bg-subtle px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
                {item.badge}
              </span>
            ) : null}
            {variant === 'underline' && active ? (
              <motion.span
                layoutId={`tabs-indicator-${tablistId}`}
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-navy"
                transition={reduce ? { duration: 0 } : { duration: 0.18, ease: [0.2, 0, 0, 1] }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
