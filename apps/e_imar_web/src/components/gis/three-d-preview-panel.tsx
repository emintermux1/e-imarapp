import * as React from "react";
import { Lock, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataCard } from "./data-card";

export function ThreeDPreviewPanel({
  className,
  disabled = true
}: {
  className?: string;
  disabled?: boolean;
}) {
  return (
    <DataCard
      title={
        <span className="inline-flex items-center gap-1.5">
          <Box className="h-3.5 w-3.5 text-fg-muted" /> 3D Önizleme
        </span>
      }
      subtitle="Cesium tabanlı 3D yapı kütle modeli (Task 2)"
      padding="sm"
      variant="subtle"
      rightSlot={
        disabled && (
          <span className="inline-flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-fg-muted">
            <Lock className="h-3 w-3" /> Yakında
          </span>
        )
      }
      className={cn(className)}
    >
      <div className="relative h-28 rounded-sm border border-border-subtle overflow-hidden">
        <div
          aria-hidden
          className={cn(
            "absolute inset-0",
            "bg-[linear-gradient(180deg,rgb(var(--surface-1)),rgb(var(--surface-2)))]",
            "[background-image:linear-gradient(rgb(var(--border-subtle)/0.6)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--border-subtle)/0.6)_1px,transparent_1px)]",
            "[background-size:14px_14px]"
          )}
        />
        <div className="absolute inset-0 grid place-items-center text-[10px] uppercase tracking-wider text-fg-muted">
          Kütle modeli yakında
        </div>
      </div>
    </DataCard>
  );
}
