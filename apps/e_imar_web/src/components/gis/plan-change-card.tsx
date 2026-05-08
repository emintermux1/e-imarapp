import * as React from "react";
import { DataCard } from "./data-card";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlanChangeCard({
  className,
  disabled = true
}: {
  className?: string;
  disabled?: boolean;
}) {
  return (
    <DataCard
      variant="subtle"
      padding="sm"
      title="Plan Değişikliği"
      subtitle="2018 → 2024 farkları (Task 2)"
      rightSlot={
        disabled ? (
          <span className="inline-flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-fg-muted">
            <Lock className="h-3 w-3" /> Yakında
          </span>
        ) : null
      }
      className={cn(className)}
    >
      <div
        className={cn(
          "grid grid-cols-3 gap-2 text-[11px]",
          disabled && "opacity-60"
        )}
      >
        {[
          { label: "Emsal", oncekiVal: "1.50", sonraVal: "2.40", change: "+0.90" },
          { label: "Gabari", oncekiVal: "15.5 m", sonraVal: "24.5 m", change: "+9.0 m" },
          { label: "TAKS", oncekiVal: "0.30", sonraVal: "0.40", change: "+0.10" }
        ].map((row) => (
          <div
            key={row.label}
            className="flex flex-col gap-0.5 rounded border border-border-subtle bg-surface-2 px-2 py-1.5"
          >
            <span className="text-[9px] uppercase tracking-wider text-fg-muted">
              {row.label}
            </span>
            <span className="tabular-nums text-fg-secondary line-through">
              {row.oncekiVal}
            </span>
            <span className="tabular-nums text-fg-primary font-semibold">
              {row.sonraVal}
            </span>
            <span className="text-[10px] text-status-success tabular-nums">
              {row.change}
            </span>
          </div>
        ))}
      </div>
    </DataCard>
  );
}
