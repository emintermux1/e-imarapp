"use client";

import * as React from "react";
import { X } from "lucide-react";
import { ZoningBadge } from "./zoning-badge";
import { cn } from "@/lib/utils";
import { adaParselText, formatArea } from "@/lib/format";
import type { ParcelProps } from "@/types/parcel";

interface ParcelCardProps {
  parcel: Pick<
    ParcelProps,
    | "id"
    | "ada"
    | "parsel"
    | "il"
    | "ilce"
    | "mahalle"
    | "yuzolcumuM2"
    | "zoningType"
  >;
  onClick?: () => void;
  onRemove?: () => void;
  variant?: "header" | "row";
  className?: string;
}

export function ParcelCard({
  parcel,
  onClick,
  onRemove,
  variant = "row",
  className
}: ParcelCardProps) {
  const isRow = variant === "row";
  const baseTag = isRow ? "button" : "div";
  const interactive = !!onClick && isRow;
  const Tag = baseTag as React.ElementType;
  return (
    <Tag
      type={baseTag === "button" ? "button" : undefined}
      onClick={interactive ? onClick : undefined}
      className={cn(
        "group flex w-full text-left items-stretch gap-2",
        isRow
          ? "rounded-md border border-border-subtle bg-surface-2 hover:bg-surface-1 transition-colors px-3 py-2.5"
          : "rounded-md border border-border-strong bg-surface-2 px-4 py-3.5",
        className
      )}
    >
      <div
        aria-hidden
        className="w-1 self-stretch rounded-full"
        style={{
          backgroundColor:
            "rgb(var(--accent-navy))"
        }}
      />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-2xs uppercase tracking-wider text-fg-muted">
            Ada/Parsel
          </span>
          <span className="text-base font-semibold tabular-nums text-fg-primary">
            {adaParselText(parcel.ada, parcel.parsel)}
          </span>
        </div>
        <div className="text-xs text-fg-secondary truncate">
          {parcel.mahalle} · {parcel.ilce} / {parcel.il}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <ZoningBadge type={parcel.zoningType} size="xs" />
          <span className="text-[11px] tabular-nums text-fg-muted">
            {formatArea(parcel.yuzolcumuM2)}
          </span>
        </div>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Watchlist'ten kaldır"
          className="self-start mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-sm text-fg-muted hover:text-fg-primary hover:bg-surface-3 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </Tag>
  );
}
