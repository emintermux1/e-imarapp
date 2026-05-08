import * as React from "react";
import { cn } from "@/lib/utils";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  combo?: string[];
}

export function Kbd({ className, children, combo, ...props }: KbdProps) {
  if (combo && combo.length > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 align-baseline" aria-hidden>
        {combo.map((k, i) => (
          <kbd
            key={`${k}-${i}`}
            className={cn(
              "inline-flex h-5 min-w-[20px] items-center justify-center rounded-sm border border-border-strong bg-surface-1 px-1.5 text-[10px] font-medium tabular-nums text-fg-secondary shadow-[0_1px_0_0_rgb(var(--border-subtle))]",
              className
            )}
          >
            {k}
          </kbd>
        ))}
      </span>
    );
  }
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-[20px] items-center justify-center rounded-sm border border-border-strong bg-surface-1 px-1.5 text-[10px] font-medium tabular-nums text-fg-secondary",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
