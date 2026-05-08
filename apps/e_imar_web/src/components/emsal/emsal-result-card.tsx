import * as React from "react";
import { cn } from "@/lib/utils";

interface EmsalResultCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "error";
}

const toneClass: Record<NonNullable<EmsalResultCardProps["tone"]>, string> = {
  default: "text-fg-primary",
  success: "text-status-success",
  warning: "text-status-warning",
  error: "text-status-error"
};

export function EmsalResultCard({ label, value, hint, tone = "default" }: EmsalResultCardProps) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-2 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-fg-muted">{label}</div>
      <div className={cn("text-base font-semibold tabular-nums mt-0.5", toneClass[tone])}>
        {value}
      </div>
      {hint && <div className="text-[11px] text-fg-muted mt-0.5">{hint}</div>}
    </div>
  );
}
