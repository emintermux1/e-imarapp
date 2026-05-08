import * as React from "react";
import type { ParcelProps } from "@/types/parcel";

export function SectionPlanNotlari({ parcel }: { parcel: ParcelProps }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {parcel.planNotlari.map((note, i) => (
        <li
          key={i}
          className="flex items-start gap-2 rounded-sm border border-border-subtle bg-surface-2 px-3 py-2 text-[12px] leading-relaxed text-fg-secondary"
        >
          <span
            aria-hidden
            className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-fg-muted"
          />
          <span>{note}</span>
        </li>
      ))}
    </ul>
  );
}
