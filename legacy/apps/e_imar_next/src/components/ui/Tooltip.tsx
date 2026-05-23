'use client';

import { ReactElement, ReactNode, cloneElement, useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface TooltipProps {
  content: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  delayMs?: number;
  className?: string;
  children: ReactElement;
}

export function Tooltip({
  content,
  side = 'top',
  align = 'center',
  delayMs = 150,
  className,
  children,
}: TooltipProps) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const show = () => {
    clearTimeout(timer);
    timer = setTimeout(() => setOpen(true), delayMs);
  };
  const hide = () => {
    clearTimeout(timer);
    setOpen(false);
  };

  const sidePosition: Record<typeof side, string> = {
    top: '-translate-y-full -mt-2 top-0 left-1/2 -translate-x-1/2',
    bottom: 'translate-y-1 top-full left-1/2 -translate-x-1/2',
    left: 'right-full -translate-x-2 top-1/2 -translate-y-1/2',
    right: 'left-full translate-x-2 top-1/2 -translate-y-1/2',
  };

  const alignAdjust: Record<typeof align, string> = {
    start: '',
    center: '',
    end: '',
  };

  // Avoid TS unused parameter warning
  void alignAdjust;
  void align;

  const trigger = cloneElement(children as ReactElement, {
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    'aria-describedby': open ? tooltipId : undefined,
  });

  return (
    <span className="relative inline-flex">
      {trigger}
      <AnimatePresence>
        {open ? (
          <motion.span
            id={tooltipId}
            role="tooltip"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: side === 'top' ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.16, ease: [0.2, 0, 0, 1] }}
            className={cn(
              'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-bg-inverse px-2 py-1 text-[12px] font-medium text-text-inverse shadow-panel',
              sidePosition[side],
              className,
            )}
          >
            {content}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
