import * as React from "react";
import { cn } from "@/lib/utils";

interface DataCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  rightSlot?: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "subtle" | "raised";
}

const paddingClass: Record<NonNullable<DataCardProps["padding"]>, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-5"
};

export function DataCard({
  title,
  subtitle,
  rightSlot,
  padding = "md",
  variant = "default",
  className,
  children,
  ...props
}: DataCardProps) {
  const variantClass: Record<NonNullable<typeof variant>, string> = {
    default: "bg-surface-2 border-border-subtle shadow-card",
    subtle: "bg-surface-1 border-border-subtle",
    raised: "bg-surface-2 border-border-strong shadow-pop"
  };
  return (
    <section
      className={cn(
        "rounded-md border",
        variantClass[variant],
        paddingClass[padding],
        className
      )}
      {...props}
    >
      {(title || rightSlot || subtitle) && (
        <header
          className={cn(
            "flex items-start justify-between gap-3",
            children !== undefined && "mb-3"
          )}
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            {title && (
              <h3 className="text-sm font-semibold text-fg-primary truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-fg-muted truncate">{subtitle}</p>
            )}
          </div>
          {rightSlot}
        </header>
      )}
      {children}
    </section>
  );
}

export function DataRow({
  label,
  value,
  hint,
  className,
  ...props
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "children">) {
  return (
    <div
      className={cn(
        "grid grid-cols-[100px_1fr] items-baseline gap-3 py-1.5 border-b border-border-subtle/60 last:border-b-0",
        className
      )}
      {...props}
    >
      <dt className="text-[11px] uppercase tracking-wider text-fg-muted">
        {label}
      </dt>
      <dd className="flex flex-col gap-0.5">
        <span className="text-sm tabular-nums text-fg-primary">{value}</span>
        {hint && <span className="text-[11px] text-fg-muted">{hint}</span>}
      </dd>
    </div>
  );
}
