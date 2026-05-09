import * as React from "react";
import type { ParcelProps } from "@/types/parcel";
import {
  resolveSemanticParcelAction,
  useSemanticParcelAction
} from "@/lib/maplibre/semantic-focus";

export function SectionPlanNotlari({ parcel }: { parcel: ParcelProps }) {
  const handleSemantic = useSemanticParcelAction(parcel);
  return (
    <ul className="flex flex-col gap-1.5">
      {parcel.planNotlari.map((note, i) => (
        <li key={i}>
          {resolveSemanticParcelAction(note, "note") ? (
            <button
              type="button"
              onClick={() => handleSemantic(note, "note")}
              className="group flex w-full items-start justify-between gap-3 rounded-sm border border-border-subtle bg-surface-2 px-3 py-2 text-left text-[12px] leading-relaxed text-fg-secondary transition-colors hover:border-border-strong hover:bg-surface-1"
            >
              <span className="flex items-start gap-2 min-w-0">
                <span
                  aria-hidden
                  className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-fg-muted"
                />
                <span>{note}</span>
              </span>
              <span className="shrink-0 rounded-sm border border-border-subtle bg-surface-1 px-2 py-0.5 text-[10px] uppercase tracking-wider text-fg-muted group-hover:text-fg-primary">
                Haritada Göster
              </span>
            </button>
          ) : (
            <div className="flex items-start gap-2 rounded-sm border border-border-subtle bg-surface-2 px-3 py-2 text-[12px] leading-relaxed text-fg-secondary">
              <span
                aria-hidden
                className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-fg-muted"
              />
              <span>{note}</span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
