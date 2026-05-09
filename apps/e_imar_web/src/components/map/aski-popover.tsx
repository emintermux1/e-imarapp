"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CalendarClock,
  Building2,
  ScrollText,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wrench
} from "lucide-react";
import {
  type AskiPolygonFeature,
  ASKI_STATUS_STYLE,
  askiRemainingDays
} from "@/data/aski-polygons";
import {
  buildFlyTargetFromLocationTarget,
  getRingBounds,
  getRingCentroid
} from "@/data/location-navigation";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";
import { getParcelById } from "@/data/parcels";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AskiPopoverProps {
  feature: AskiPolygonFeature;
  position: { x: number; y: number };
  onClose: () => void;
}

const STATUS_ICON: Record<AskiPolygonFeature["durum"], React.ReactNode> = {
  askida: <AlertTriangle className="h-3.5 w-3.5" />,
  onaylandi: <CheckCircle2 className="h-3.5 w-3.5" />,
  reddedildi: <XCircle className="h-3.5 w-3.5" />,
  donusum: <Wrench className="h-3.5 w-3.5" />
};

/**
 * Compact side popover that appears next to a clicked askı polygon.
 *
 * Renders in a fixed position relative to the click point but is clamped
 * inside the viewport. We intentionally do NOT open the right info panel.
 */
export function AskiPopover({ feature, position, onClose }: AskiPopoverProps) {
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const flyTo = useMapStore((s) => s.flyTo);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [adj, setAdj] = React.useState<{ left: number; top: number }>({
    left: position.x + 16,
    top: position.y + 8
  });
  const meta = ASKI_STATUS_STYLE[feature.durum];
  const remaining = askiRemainingDays(feature);

  React.useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    let left = position.x + 16;
    let top = position.y + 8;
    if (left + rect.width + 8 > window.innerWidth) {
      left = position.x - rect.width - 16;
    }
    if (top + rect.height + 8 > window.innerHeight) {
      top = window.innerHeight - rect.height - 12;
    }
    setAdj({ left: Math.max(8, left), top: Math.max(64, top) });
  }, [position.x, position.y]);

  function openParcel() {
    if (!feature.matchedParcelId) return;
    const f = getParcelById(feature.matchedParcelId);
    setSelectedParcelId(feature.matchedParcelId);
    setRightPanelOpen(true);
    if (f?.properties.centroid) {
      flyTo({ center: f.properties.centroid, zoom: 16 });
    }
    onClose();
  }

  function openRegion() {
    const bounds = getRingBounds(feature.ring);
    const center = getRingCentroid(feature.ring) ?? feature.ring[0];
    if (!center) return;
    setSelectedParcelId(null);
    setRightPanelOpen(false);
    flyTo(
      buildFlyTargetFromLocationTarget(
        {
          label: feature.label,
          center,
          zoom: 14.7,
          kind: "mahalle"
        },
        bounds ? { bounds, zoom: 14.7 } : { zoom: 14.7 }
      )
    );
    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        key="aski-popover"
        ref={containerRef}
        role="dialog"
        aria-label="Askı detayı"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.14, ease: "easeOut" }}
        className="fixed z-50 w-[320px] max-w-[92vw] rounded-md border border-border-strong bg-surface-2 shadow-pop"
        style={{ left: adj.left, top: adj.top }}
      >
        <header
          className="flex items-start justify-between gap-3 px-3 py-2.5 border-b border-border-subtle rounded-t-md"
          style={{
            backgroundColor: `rgb(${meta.rgb} / 0.08)`
          }}
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium tabular-nums uppercase tracking-wider"
              style={{ color: `rgb(${meta.rgb})` }}
            >
              {STATUS_ICON[feature.durum]}
              {meta.label}
              {feature.id && (
                <span className="text-fg-muted">· {feature.id}</span>
              )}
            </span>
            <h2 className="text-sm font-semibold text-fg-primary leading-snug">
              {feature.label}
            </h2>
            {feature.planAdi && (
              <span className="text-[11px] text-fg-secondary truncate">
                {feature.planAdi}
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            className="h-7 w-7 inline-flex items-center justify-center rounded text-fg-muted hover:text-fg-primary hover:bg-surface-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>
        <div className="px-3 py-2.5 flex flex-col gap-2 text-[12px]">
          <Row
            icon={<Building2 className="h-3.5 w-3.5" />}
            label="Belediye"
            value={feature.belediye}
          />
          <Row
            icon={<CalendarClock className="h-3.5 w-3.5" />}
            label="Süre"
            value={
              <span>
                {formatDate(feature.baslangic)} → {formatDate(feature.bitis)}
              </span>
            }
            hint={
              feature.durum === "askida"
                ? remaining > 0
                  ? `${remaining} gün kaldı`
                  : "Süre doldu"
                : undefined
            }
          />
          <Row
            icon={<ScrollText className="h-3.5 w-3.5" />}
            label="Kapsam"
            value={feature.id}
          />
        </div>
        <footer className="px-3 pb-3 pt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={openRegion}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-sm text-[12px] font-medium transition-colors bg-surface-1 hover:bg-surface-3 text-fg-primary border border-border-subtle"
          >
            Bölgeye Git <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={openParcel}
            disabled={!feature.matchedParcelId}
            className={cn(
              "inline-flex items-center gap-1 h-7 px-2.5 rounded-sm text-[12px] font-medium transition-colors",
              feature.matchedParcelId
                ? "bg-surface-1 hover:bg-surface-3 text-fg-primary border border-border-subtle"
                : "bg-surface-1 text-fg-muted/70 border border-border-subtle cursor-not-allowed"
            )}
          >
            Detay <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] uppercase tracking-wider text-fg-muted ml-auto">
            Askı kaydı
          </span>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}

function Row({
  icon,
  label,
  value,
  hint
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-fg-muted">{icon}</span>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-fg-muted">
          {label}
        </span>
        <span className="text-fg-primary tabular-nums truncate">{value}</span>
        {hint && (
          <span className="text-[10px] text-fg-muted">{hint}</span>
        )}
      </div>
    </div>
  );
}
