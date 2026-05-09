"use client";

import * as React from "react";
import { motion, useDragControls, type PanInfo } from "framer-motion";
import { X, Star, Calculator, Share2 } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ZoningBadge } from "@/components/gis/zoning-badge";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";
import { useParcel } from "@/hooks/use-parcel";
import { useWatchlistStore } from "@/stores/watchlist-store";
import { adaParselText, formatArea, formatDate } from "@/lib/format";
import { SectionKonum } from "@/components/info/section-konum";
import { SectionImar } from "@/components/info/section-imar";
import { SectionPlanNotlari } from "@/components/info/section-plan-notlari";
import { SectionRiskler } from "@/components/info/section-riskler";
import { SectionAski } from "@/components/info/section-aski";
import { SectionCevre } from "@/components/info/section-cevre";
import { SectionGecmis } from "@/components/info/section-gecmis";
import { SectionYatirimSkoru } from "@/components/info/section-yatirim-skoru";
import { SectionParcelSummary } from "@/components/info/section-parcel-summary";
import { SourceBadge } from "@/components/gis/source-badge";
import { EmsalCalculatorPanel } from "@/components/emsal/emsal-calculator-panel";
import { useBackendParcelStore } from "@/stores/backend-parcel-store";
import { useLatestRegionsStore } from "@/stores/latest-regions-store";
import { getBackendParcelContext, getBackendParcelSummary, humanizeApiError } from "@/lib/api/backend-client";
import { formatQualityTimestamp, geometryLabel, matchStatusLabel, reportEligibilityLabel, sourceStatusLabel } from "@/lib/api/quality-labels";
import type { ParcelContextResponse, ParcelSummaryResponse } from "@/types/api";
import { cn } from "@/lib/utils";
import { getParcelSourceMetadata } from "@/data/parcels";

const SNAP_HEIGHTS = {
  peek: 96,
  half: () => Math.round(window.innerHeight * 0.45),
  full: () => Math.round(window.innerHeight * 0.9)
};

export function MobileBottomSheet() {
  const open = useUIStore((s) => s.rightPanelOpen);
  const setOpen = useUIStore((s) => s.setRightPanelOpen);
  const snap = useUIStore((s) => s.mobileSheetSnap);
  const setSnap = useUIStore((s) => s.setMobileSheetSnap);
  const selectedId = useMapStore((s) => s.selectedParcelId);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const watchlistAdd = useWatchlistStore((s) => s.add);
  const watchlistRemove = useWatchlistStore((s) => s.remove);
  const watchlistHas = useWatchlistStore((s) => s.has);
  const parcelFeature = useParcel(selectedId);
  const parcel = parcelFeature?.properties ?? null;
  const dragControls = useDragControls();
  const parcelSource = getParcelSourceMetadata();
  const backendGeometry = useBackendParcelStore((s) => s.getGeometry(selectedId));
  const latestRegionsItems = useLatestRegionsStore((s) => s.items);
  const latestRegionsStatus = useLatestRegionsStore((s) => s.status);
  const latestRegionsTotal = useLatestRegionsStore((s) => s.total);
  const latestRegionsGeometryCount = useLatestRegionsStore((s) => s.geometryCount);
  const refreshLatestRegions = useLatestRegionsStore((s) => s.refresh);

  const [emsalOpen, setEmsalOpen] = React.useState(false);
  const [vh, setVh] = React.useState<number>(800);
  const [parcelContext, setParcelContext] = React.useState<ParcelContextResponse | null>(null);
  const [parcelSummary, setParcelSummary] = React.useState<ParcelSummaryResponse | null>(null);
  const [summaryMessage, setSummaryMessage] = React.useState<string | undefined>();

  React.useEffect(() => {
    const apply = () => setVh(window.innerHeight);
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  React.useEffect(() => {
    if (!parcel?.backendId) {
      setParcelContext(null);
      setParcelSummary(null);
      setSummaryMessage(undefined);
      return;
    }
    let cancelled = false;
    setSummaryMessage("Canlı parsel özeti hazırlanıyor…");
    Promise.allSettled([
      getBackendParcelContext(parcel.backendId, { include_geometry: false, limit: 4 }),
      getBackendParcelSummary(parcel.backendId)
    ]).then(([contextResult, summaryResult]) => {
      if (cancelled) return;
      const context = contextResult.status === "fulfilled" ? contextResult.value : null;
      const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
      setParcelContext(context);
      setParcelSummary(summary);
      if (context || summary) setSummaryMessage(undefined);
      else setSummaryMessage(humanizeApiError(contextResult.status === "rejected" ? contextResult.reason : undefined, "Mobil özet endpoint'i kullanılamıyor."));
    });
    return () => {
      cancelled = true;
    };
  }, [parcel?.backendId]);

  if (!open || !parcel) return null;

  const heightForSnap = (s: typeof snap) => {
    if (s === "peek") return SNAP_HEIGHTS.peek;
    if (s === "half") return Math.round(vh * 0.45);
    return Math.round(vh * 0.9);
  };

  const snapHeight = heightForSnap(snap);

  function onDragEnd(_: unknown, info: PanInfo) {
    const v = info.velocity.y;
    const offset = info.offset.y;
    if (offset > 80 || v > 600) {
      // dragging down
      if (snap === "full") setSnap("half");
      else if (snap === "half") setSnap("peek");
      else setOpen(false);
    } else if (offset < -80 || v < -600) {
      if (snap === "peek") setSnap("half");
      else if (snap === "half") setSnap("full");
    }
  }

  function close() {
    setOpen(false);
    setSelectedParcelId(null);
  }

  function toggleWatchlist() {
    if (!parcel) return;
    if (watchlistHas(parcel.id)) {
      watchlistRemove(parcel.id);
    } else {
      watchlistAdd({
        id: parcel.id,
        ada: parcel.ada,
        parsel: parcel.parsel,
        il: parcel.il,
        ilce: parcel.ilce,
        mahalle: parcel.mahalle,
        zoningType: parcel.zoningType,
        yuzolcumuM2: parcel.yuzolcumuM2,
        centroid: parcel.centroid ?? [0, 0],
        provenance: parcelSource.official ? "official" : parcelSource.mode === "demo" ? "demo" : "derived"
      });
    }
  }

  const isWatchlisted = watchlistHas(parcel.id);

  return (
    <motion.div
      role="dialog"
      aria-label="Parsel detay"
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragEnd={onDragEnd}
      animate={{ height: snapHeight }}
      transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
      className={cn(
        "lg:hidden fixed left-0 right-0 bottom-0 z-30 bg-surface-2/98 border-t border-border-strong backdrop-blur-sm",
        "rounded-t-[18px] shadow-sheet flex flex-col touch-pan-y"
      )}
    >
      <button
        type="button"
        aria-label="Sürükle"
        className="self-stretch py-3 cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <span className="block mx-auto h-1.5 w-12 rounded-full bg-border-strong" />
      </button>
      <header className="flex items-start justify-between gap-2 px-4 pb-2 border-b border-border-subtle">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] uppercase tracking-wider text-fg-muted">
              Ada/Parsel
            </span>
            <span className="text-base font-semibold tabular-nums text-fg-primary">
              {adaParselText(parcel.ada, parcel.parsel)}
            </span>
            <ZoningBadge type={parcel.zoningType} size="xs" />
          </div>
          <div className="text-[11px] text-fg-secondary truncate">
            {parcel.mahalle} · {parcel.ilce} / {parcel.il} · {formatArea(parcel.yuzolcumuM2)}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <SourceBadge status={parcel.sourceStatus ?? "demo"} className="h-4 px-1.5 text-[8px]" />
            <SourceBadge status={backendGeometry ? "live" : parcel.centroid ? "demo" : "unavailable"} label={backendGeometry ? "canlı geometri" : parcel.centroid ? "yaklaşık konum" : "geometri yok"} className="h-4 px-1.5 text-[8px]" />
          </div>
        </div>
        <button
          type="button"
          aria-label="Kapat"
          onClick={close}
          className="h-7 w-7 inline-flex items-center justify-center rounded text-fg-muted hover:text-fg-primary hover:bg-surface-1"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto">
        <Accordion
          type="multiple"
          defaultValue={["ozet", "son-bolgeler", "konum", "imar"]}
          className="divide-y divide-border-subtle"
        >
              <div className="px-0">
                <SectionParcelSummary parcel={parcel} />
              </div>
              <AccordionItem value="ozet">
                <AccordionTrigger>Paylaşılabilir özet</AccordionTrigger>
                <AccordionContent>
                  <MobileShareSummary parcel={parcel} summary={parcelSummary} context={parcelContext} message={summaryMessage} hasGeometry={Boolean(backendGeometry || parcel.centroid)} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="son-bolgeler">
                <AccordionTrigger>En yeni bölgeler</AccordionTrigger>
                <AccordionContent>
                  <MobileLatestRegions
                    total={latestRegionsTotal}
                    geometryCount={latestRegionsGeometryCount}
                    status={latestRegionsStatus}
                    items={latestRegionsItems.slice(0, 3)}
                    onRefresh={() => void refreshLatestRegions({ limit: 10 })}
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="konum">
            <AccordionTrigger>Konum & Tapu</AccordionTrigger>
            <AccordionContent>
              <SectionKonum parcel={parcel} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="imar">
            <AccordionTrigger>İmar Durumu</AccordionTrigger>
            <AccordionContent>
              <SectionImar parcel={parcel} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="plan-notlari">
            <AccordionTrigger>Plan Notları</AccordionTrigger>
            <AccordionContent>
              <SectionPlanNotlari parcel={parcel} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="riskler">
            <AccordionTrigger>Riskler</AccordionTrigger>
            <AccordionContent>
              <SectionRiskler parcel={parcel} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="aski">
            <AccordionTrigger>Askı Durumu</AccordionTrigger>
            <AccordionContent>
              <SectionAski parcel={parcel} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="cevre">
            <AccordionTrigger>Çevre & Erişilebilirlik</AccordionTrigger>
            <AccordionContent>
              <SectionCevre parcel={parcel} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="gecmis">
            <AccordionTrigger>Geçmiş & Plan Değişiklikleri</AccordionTrigger>
            <AccordionContent>
              <SectionGecmis parcel={parcel} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="yatirim">
            <AccordionTrigger>Yatırım Skoru</AccordionTrigger>
            <AccordionContent>
              <SectionYatirimSkoru parcel={parcel} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <footer className="grid grid-cols-3 gap-2 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 border-t border-border-subtle bg-surface-1/60">
        <Button variant="primary" size="sm" onClick={() => setEmsalOpen(true)} className="min-h-11">
          <Calculator className="h-3.5 w-3.5" /> Emsal
        </Button>
        <Button variant="secondary" size="sm" onClick={toggleWatchlist} className="min-h-11">
          <Star className={cn("h-3.5 w-3.5", isWatchlisted && "fill-[rgb(var(--accent-red))] text-[rgb(var(--accent-red))]")} />
          {isWatchlisted ? "Listede" : "Takip Et"}
        </Button>
        <Button variant="ghost" size="sm" className="min-h-11">
          <Share2 className="h-3.5 w-3.5" /> Özet
        </Button>
      </footer>
      <EmsalCalculatorPanel
        open={emsalOpen}
        onOpenChange={setEmsalOpen}
        parcel={parcel}
      />
    </motion.div>
  );
}

function MobileShareSummary({
  parcel,
  summary,
  context,
  message,
  hasGeometry
}: {
  parcel: NonNullable<ReturnType<typeof useParcel>>["properties"];
  summary: ParcelSummaryResponse | null;
  context: ParcelContextResponse | null;
  message?: string;
  hasGeometry: boolean;
}) {
  const relatedPlanCount = summary?.related_plan_count ?? context?.related_plans.length ?? 0;
  const relatedAskiCount = summary?.related_aski_count ?? context?.active_aski_plans.length ?? 0;
  const sourceStatus = summary?.source_trust.source_status ?? parcel.sourceStatus ?? "demo";
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-border-subtle bg-surface-2/90 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-fg-muted">Rapor özeti</div>
            <div className="mt-0.5 text-base font-semibold tabular-nums text-fg-primary">{adaParselText(parcel.ada, parcel.parsel)}</div>
            <div className="mt-1 truncate text-[11px] text-fg-secondary">{parcel.mahalle} · {parcel.ilce} / {parcel.il}</div>
          </div>
          <SourceBadge status={sourceStatus} label={sourceStatusLabel(sourceStatus)} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <MobileSummaryFact label="Geometri" value={summary?.geometry_status ? geometryLabel(summary.geometry_status === "available") : geometryLabel(hasGeometry)} />
          <MobileSummaryFact label="Plan / Askı" value={`${relatedPlanCount} / ${relatedAskiCount}`} />
          <MobileSummaryFact label="Rapor" value={reportEligibilityLabel(summary?.report_eligibility)} />
          <MobileSummaryFact label="Üretim" value={summary?.generated_at ? formatQualityTimestamp(summary.generated_at) : "endpoint bekleniyor"} />
        </div>
        {(summary?.warnings?.length || message) && (
          <div className="mt-3 rounded-md border border-status-warning/30 bg-status-warning/10 px-2 py-1.5 text-[11px] leading-snug text-status-warning">
            {summary?.warnings?.slice(0, 2).join(" · ") ?? message}
          </div>
        )}
      </div>
      {context?.match_method && (
        <div className="rounded-md border border-border-subtle bg-surface-2 px-2.5 py-2 text-[11px] text-fg-secondary">
          Plan öneri yöntemi: <span className="font-semibold text-fg-primary">{matchStatusLabel(context.match_method)}</span>
        </div>
      )}
    </div>
  );
}

function MobileSummaryFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-1/70 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-fg-muted">{label}</div>
      <div className="mt-0.5 truncate font-medium text-fg-primary">{value}</div>
    </div>
  );
}

function MobileLatestRegions({
  total,
  geometryCount,
  status,
  items,
  onRefresh
}: {
  total: number;
  geometryCount: number;
  status: string;
  items: Array<{
    id: number;
    label: string;
    status?: string;
    aski_start?: string;
    aski_end?: string;
    has_geometry: boolean;
  }>;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <MobileSummaryFact label="Kayıt" value={String(total)} />
        <MobileSummaryFact label="Geometri" value={String(geometryCount)} />
        <button type="button" onClick={onRefresh} className="min-h-11 rounded-md border border-border-subtle bg-surface-2 px-3 text-[11px] font-medium text-fg-secondary">
          Yenile
        </button>
      </div>
      <div className="rounded-md border border-border-subtle bg-surface-2 px-2.5 py-2 text-[11px] text-fg-secondary">
        Durum: {sourceStatusLabel(status)}. Toplu poligon çizilmez; masaüstünde yalnız seçili kayıt vurgulanır.
      </div>
      {items.length === 0 ? (
        <div className="rounded-md border border-border-subtle bg-surface-2 px-2.5 py-2 text-[11px] text-fg-muted">Henüz yeni bölge listesi yok.</div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="rounded-md border border-border-subtle bg-surface-2 px-2.5 py-2">
            <div className="line-clamp-2 text-[12px] font-medium text-fg-primary">{item.label}</div>
            <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-fg-muted">
              <span>{item.status ?? "durum yok"} · {item.aski_start ? formatDate(item.aski_start) : "askı tarihi yok"}</span>
              <SourceBadge status={item.has_geometry ? "computed" : "unavailable"} label={item.has_geometry ? "geom" : "yok"} className="h-4 px-1 text-[8px]" />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
