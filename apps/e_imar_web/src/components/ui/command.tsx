"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CommandRootProps {
  children: React.ReactNode;
  className?: string;
  onArrowDown?: () => void;
  onArrowUp?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
}

/**
 * Minimal cmdk-style scaffolding — handles arrow/enter/escape on a wrapper.
 * The list/items handle highlighting visually via aria-selected.
 */
export function CommandRoot({
  children,
  className,
  onArrowDown,
  onArrowUp,
  onEnter,
  onEscape
}: CommandRootProps) {
  function handleKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      onArrowDown?.();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onArrowUp?.();
    } else if (e.key === "Enter") {
      onEnter?.();
    } else if (e.key === "Escape") {
      onEscape?.();
    }
  }
  return (
    <div className={cn("flex flex-col", className)} onKeyDown={handleKey}>
      {children}
    </div>
  );
}

export function CommandInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full bg-transparent px-2 text-sm text-fg-primary placeholder:text-fg-muted",
        "focus:outline-none focus-visible:outline-none border-0",
        className
      )}
      {...props}
    />
  );
}

export function CommandList({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="listbox"
      className={cn(
        "max-h-[60vh] overflow-y-auto py-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CommandEmpty({
  className,
  children
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-3 py-8 text-center text-xs text-fg-muted",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CommandGroup({
  heading,
  children,
  className
}: {
  heading?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("py-1", className)}>
      {heading && (
        <div className="px-3 pb-1 pt-1 text-[10px] uppercase tracking-wider text-fg-muted">
          {heading}
        </div>
      )}
      {children}
    </div>
  );
}

interface CommandItemProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  onSelectItem?: () => void;
  disabled?: boolean;
}

export function CommandItem({
  selected,
  onSelectItem,
  className,
  children,
  disabled,
  ...props
}: CommandItemProps) {
  return (
    <div
      role="option"
      aria-selected={!!selected}
      data-selected={selected ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={cn(
        "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors select-none",
        "border-l-2 border-transparent",
        selected
          ? "bg-surface-1 border-l-brand-blue text-fg-primary"
          : "text-fg-primary hover:bg-surface-1/70",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={() => {
        if (!disabled) onSelectItem?.();
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export const CommandSeparator = ({ className }: { className?: string }) => (
  <div className={cn("mx-2 my-1 h-px bg-border-subtle", className)} />
);
