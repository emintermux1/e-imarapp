import * as React from "react";
import { cn } from "@/lib/utils";
import { ZONING_PRESETS } from "@/data/zoning";
import type { ZoningType } from "@/types/parcel";

interface ZoningBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  type: ZoningType;
  size?: "xs" | "sm" | "md";
  withDot?: boolean;
}

export function ZoningBadge({
  type,
  size = "sm",
  withDot = true,
  className,
  ...props
}: ZoningBadgeProps) {
  const preset = ZONING_PRESETS[type] ?? ZONING_PRESETS.Konut;
  const sizeClass: Record<NonNullable<typeof size>, string> = {
    xs: "h-5 px-1.5 text-[10px]",
    sm: "h-6 px-2 text-[11px]",
    md: "h-7 px-2.5 text-xs"
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border font-medium tabular-nums",
        sizeClass[size],
        className
      )}
      style={{
        backgroundColor: preset.fill,
        borderColor: preset.stroke,
        color: preset.stroke
      }}
      {...props}
    >
      {withDot && (
        <span
          className="block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: preset.stroke }}
          aria-hidden
        />
      )}
      <span className="truncate">{preset.label}</span>
    </span>
  );
}
