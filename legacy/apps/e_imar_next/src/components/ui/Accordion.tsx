'use client';

import { ReactNode, useCallback, useId, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface AccordionItemProps {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  disabled?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}

interface AccordionProps {
  type?: 'single' | 'multiple';
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  children: ReactNode;
  className?: string;
}

export function Accordion({
  type = 'multiple',
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: AccordionProps) {
  const [internal, setInternal] = useState<string[]>(defaultValue ?? []);
  const isControlled = value !== undefined;
  const open = isControlled ? value! : internal;

  const toggle = useCallback(
    (id: string) => {
      const next = open.includes(id)
        ? open.filter((v) => v !== id)
        : type === 'single'
        ? [id]
        : [...open, id];
      if (!isControlled) setInternal(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange, open, type],
  );

  const ctx = useMemo(() => ({ open, toggle }), [open, toggle]);
  return (
    <AccordionContext.Provider value={ctx}>
      <div className={cn('flex flex-col divide-y divide-border-subtle', className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

import { createContext, useContext } from 'react';

const AccordionContext = createContext<{
  open: string[];
  toggle: (id: string) => void;
} | null>(null);

function useAccordion() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('AccordionItem must be used within Accordion');
  return ctx;
}

export function AccordionItem({
  id,
  title,
  description,
  trailing,
  disabled,
  children,
}: AccordionItemProps) {
  const { open, toggle } = useAccordion();
  const isOpen = open.includes(id);
  const headingId = useId();
  const panelId = useId();
  const reduce = useReducedMotion();

  return (
    <div className="group">
      <h3 className="m-0">
        <button
          type="button"
          id={headingId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          disabled={disabled}
          onClick={() => toggle(id)}
          className={cn(
            'flex w-full items-center gap-3 px-4 py-3 text-left text-text-primary',
            'hover:bg-bg-subtle/50 focus-visible:shadow-focus focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'transition-colors',
          )}
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-text-muted transition-transform',
              isOpen && 'rotate-180 text-text-primary',
            )}
            aria-hidden
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-[15px] leading-5">{title}</div>
            {description ? (
              <div className="mt-0.5 text-[12px] text-text-muted">{description}</div>
            ) : null}
          </div>
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="content"
            id={panelId}
            role="region"
            aria-labelledby={headingId}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.24, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
