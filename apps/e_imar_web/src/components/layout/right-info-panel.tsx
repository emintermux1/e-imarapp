"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Share2,
  Star,
  Calculator,
  FileDown,
  Loader2,
  Clock3,
  Database,
  FileSearch,
  Building2,
  ShieldAlert,
  Route,
  MapPinned,
  FileText,
  Info,
  MapPinOff,
  CheckCircle2,
  TriangleAlert,
  GitCompareArrows,
  Crosshair,
  AlertTriangle,
  Navigation
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ZoningBadge } from "@/components/gis/zoning-badge";
import { IconButton } from "@/components/ui/icon-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { SourceBadge } from "@/components/gis/source-badge";
import type { DataSourceStatus, ParcelContextResponse, ParcelSummaryResponse, RelatedPlanItem } from "@/types/api";
import {
  createBackendWatchlistItem,
  generateBackendReport,
  getBackendParcelContext,
  getBackendParcelSummary,
  getBackendReport,
  humanizeApiError
} from "@/lib/api/backend-client";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";
import { useParcel } from "@/hooks/use-parcel";
import { getParcelById } from "@/data/parcels";
import { useWatchlistStore } from "@/stores/watchlist-store";
import { useBackendParcelStore } from "@/stores/backend-parcel-store";
import { useAskiStore } from "@/stores/aski-store";
import { useLatestRegionsStore } from "@/stores/latest-regions-store";
import { adaParselText, formatArea, formatDate } from "@/lib/format";
import {
  formatQualityTimestamp,
  geometryLabel,
  matchStatusLabel,
  reportEligibilityLabel,
  sourceStatusLabel
} from "@/lib/api/quality-labels";
import { SectionKonum } from "@/components/info/section-konum";
import { SectionImar } from "@/components/info/section-imar";
import { SectionPlanNotlari } from "@/components/info/section-plan-notlari";
import { SectionRiskler } from "@/components/info/section-riskler";
import { SectionAski } from "@/components/info/section-aski";
import { SectionCevre } from "@/components/info/section-cevre";
import { SectionGecmis } from "@/components/info/section-gecmis";
import { SectionYatirimSkoru } from "@/components/info/section-yatirim-skoru";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmsalCalculatorPanel } from "@/components/emsal/emsal-calculator-panel";
import {
  buildSelectedPlaceAnalysis,
  type PlaceInsightCard,
  type SelectedPlaceAnalysis
} from "@/lib/analysis/selected-place-analysis";
import { cn } from "@/lib/utils";
import { getParcelMarket } from "@/lib/market-client";
import type { ParcelMarketResponse } from "@/types/api";
import { MarketPanel } from "@/components/market/market-panel";

export function RightInfoPanel({ floating = false }: { floating?: boolean }) {
  const open = useUIStore((s) => s.rightPanelOpen);
  const setOpen = useUIStore((s) => s.setRightPanelOpen);
  const selectedId = useMapStore((s) => s.selectedParcelId);
  const selectedPoint = useMapStore((s) => s.selectedPoint);
  const multiSelectedParcelIds = useMapStore((s) => s.multiSelectedParcelIds);
  const clearMultiSelection = useMapStore((s) => s.clearMultiSelection);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setSelectedPoint = useMapStore((s) => s.setSelectedPoint);
  const flyTo = useMapStore((s) => s.flyTo);
  const watchlistAdd = useWatchlistStore((s) => s.add);
  const watchlistRemove = useWatchlistStore((s) => s.remove);
  const watchlistHas = useWatchlistStore((s) => s.has);
  const hydrateWatchlist = useWatchlistStore((s) => s.hydrateBackend);

  const parcelFeature = useParcel(selectedId);
  const parcel = parcelFeature?.properties ?? null;
  const comparisonParcels = multiSelectedParcelIds
    .map((id) => getParcelById(id)?.properties)
    .filter((item): item is NonNullable<typeof parcel> => Boolean(item))
    .slice(0, 4);
  const isWatchlisted = parcel ? watchlistHas(parcel.id) : false;
  const backendGeometry = useBackendParcelStore((s) => s.getGeometry(selectedId));
  const backendResponse = useBackendParcelStore((s) => s.getResponse(selectedId));
  const askiStatus = useAskiStore((s) => s.status);
  const askiPlans = useAskiStore((s) => s.plans);
  const askiLastCheckedAt = useAskiStore((s) => s.lastCheckedAt);
  const latestRegionsItems = useLatestRegionsStore((s) => s.items);
  const latestRegionsStatus = useLatestRegionsStore((s) => s.status);
  const latestRegionsMessage = useLatestRegionsStore((s) => s.message);
  const latestRegionsTotal = useLatestRegionsStore((s) => s.total);
  const latestRegionsGeometryCount = useLatestRegionsStore((s) => s.geometryCount);
  const latestRegion = useLatestRegionsStore((s) => s.selectedRegion);
  const latestRegionsPanelOpen = useLatestRegionsStore((s) => s.panelOpen);
  const setLatestRegionsPanelOpen = useLatestRegionsStore((s) => s.setPanelOpen);
  const selectLatestRegion = useLatestRegionsStore((s) => s.selectRegion);

  const [emsalOpen, setEmsalOpen] = React.useState(false);
  const [reportStatus, setReportStatus] = React.useState<{
    state: "idle" | "generating" | "generated" | "pending" | "error";
    message?: string;
    url?: string;
    id?: number;
  }>({ state: "idle" });
  const [marketResponse, setMarketResponse] = React.useState<ParcelMarketResponse | null>(null);
  const [marketLoading, setMarketLoading] = React.useState(false);
  const [watchlistStatus, setWatchlistStatus] = React.useState<{
    state: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ state: "idle" });
  const [panelLoading, setPanelLoading] = React.useState(false);
  const [parcelContext, setParcelContext] = React.useState<ParcelContextResponse | null>(null);
  const [parcelSummary, setParcelSummary] = React.useState<ParcelSummaryResponse | null>(null);
  const [parcelContextStatus, setParcelContextStatus] = React.useState<{
    state: "idle" | "loading" | "ready" | "unavailable";
    message?: string;
  }>({ state: "idle" });

  React.useEffect(() => {
    setReportStatus({ state: "idle" });
    setWatchlistStatus({ state: "idle" });
    setPanelLoading(Boolean(selectedId));
    const timer = window.setTimeout(() => setPanelLoading(false), 320);
    return () => window.clearTimeout(timer);
  }, [selectedId]);

  React.useEffect(() => {
    let alive = true;
    async function loadMarket() {
      if (!parcel) {
        setMarketResponse(null);
        return;
      }
      setMarketLoading(true);
      try {
        const response = await getParcelMarket({
          parcelId: parcel.id,
          il: parcel.il,
          ilce: parcel.ilce,
          mahalle: parcel.mahalle,
          ada: parcel.ada,
          parsel: parcel.parsel,
          areaM2: parcel.yuzolcumuM2,
          zoningType: parcel.zoningType,
          centroid: parcel.centroid ?? null
        });
        if (alive) setMarketResponse(response);
      } finally {
        if (alive) setMarketLoading(false);
      }
    }
    void loadMarket();
    return () => {
      alive = false;
    };
  }, [parcel]);

  React.useEffect(() => {
    void hydrateWatchlist();
  }, [hydrateWatchlist]);

  React.useEffect(() => {
    if (!parcel?.backendId) {
      setParcelContext(null);
      setParcelSummary(null);
      setParcelContextStatus({ state: "idle", message: "Canlı API parseli değil; bağlamsal plan önerisi gösterilmiyor." });
      return;
    }
    let cancelled = false;
    setParcelContextStatus({ state: "loading", message: "Parsel bağlamı ve özet kartı hazırlanıyor…" });
    Promise.allSettled([
      getBackendParcelContext(parcel.backendId, { include_geometry: true, limit: 6 }),
      getBackendParcelSummary(parcel.backendId)
    ]).then(([contextResult, summaryResult]) => {
      if (cancelled) return;
      const context = contextResult.status === "fulfilled" ? contextResult.value : null;
      const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
      setParcelContext(context);
      setParcelSummary(summary);
      if (context || summary) {
        const failures = [contextResult, summaryResult].filter((result) => result.status === "rejected").length;
        setParcelContextStatus({ state: "ready", message: failures ? "Özetin bir bölümü alınamadı; erişilebilir canlı veriler gösteriliyor." : undefined });
      } else {
        const reason = contextResult.status === "rejected" ? contextResult.reason : summaryResult.status === "rejected" ? summaryResult.reason : undefined;
        setParcelContextStatus({ state: "unavailable", message: humanizeApiError(reason, "Parsel özet/context endpoint'i şu an kullanılamıyor.") });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [parcel?.backendId]);

  const showLatestRegions = !parcel && latestRegionsPanelOpen;
  const pointAnalysis = React.useMemo(
    () => buildSelectedPlaceAnalysis({ point: selectedPoint, parcel }),
    [parcel, selectedPoint]
  );

  if (!parcel && !showLatestRegions && !pointAnalysis) return null;

  const parcelData = parcel ?? undefined;

  function close() {
    setOpen(false);
    // optionally also clear selection
  }

  function deselect() {
    setOpen(false);
    setSelectedParcelId(null);
    setSelectedPoint(null);
    setLatestRegionsPanelOpen(false);
  }

  async function toggleWatchlist() {
    if (!parcel) return;
    if (watchlistHas(parcel.id)) {
      watchlistRemove(parcel.id);
      setWatchlistStatus({ state: "success", message: "Parsel Alarm'dan çıkarıldı" });
    } else {
      setWatchlistStatus({ state: "loading", message: "Parsel Alarm güncelleniyor…" });
      const addLocal = (message: string, state: "success" | "error" = "success") => {
        watchlistAdd({
          id: parcel.id,
          ada: parcel.ada,
          parsel: parcel.parsel,
          il: parcel.il,
          ilce: parcel.ilce,
          mahalle: parcel.mahalle,
          zoningType: parcel.zoningType,
          yuzolcumuM2: parcel.yuzolcumuM2,
          centroid: parcel.centroid ?? [0, 0]
        });
        setWatchlistStatus({ state, message });
      };
      if (parcel.backendId) {
        try {
          await createBackendWatchlistItem({
            parcel_id: parcel.backendId,
            label: `${parcel.ada}/${parcel.parsel} ${parcel.ilce}/${parcel.il}`,
            notification_channels: ["push", "email"]
          });
          addLocal("Parsel Alarm canlı kayıt isteğiyle eklendi");
        } catch (error) {
          addLocal(`${humanizeApiError(error)} Yerel yedek listeye eklendi.`, "error");
        }
      } else {
        addLocal("Canlı API parseli değil — yerel Parsel Alarm profiline eklendi");
      }
    }
  }

  function selectRelatedPlan(item: RelatedPlanItem) {
    if (!item.has_geometry || !item.geom_geojson) return;
    selectLatestRegion({
      id: item.id,
      label: item.label,
      municipality_id: item.municipality_id ?? undefined,
      municipality_name: item.municipality_name ?? undefined,
      municipality_slug: item.municipality_slug ?? undefined,
      province: item.province ?? undefined,
      district: item.district ?? undefined,
      plan_type: item.plan_type ?? undefined,
      status: item.status ?? undefined,
      aski_start: item.aski_start ?? undefined,
      aski_end: item.aski_end ?? undefined,
      pdf_url: item.pdf_url ?? undefined,
      gml_url: item.gml_url ?? undefined,
      source: "computed",
      has_geometry: item.has_geometry,
      geom_geojson: item.geom_geojson ?? undefined
    });
  }

  async function generateReport() {
    if (!parcel) return;
    if (!parcel.backendId) {
      setReportStatus({
        state: "error",
        message: "Canlı API parseli olmadan resmi rapor üretilemez"
      });
      return;
    }
    setReportStatus({ state: "generating", message: "PDF rapor hazırlanıyor…" });
    try {
      const report = await generateBackendReport({
        parcel_id: parcel.backendId,
        report_type: "parcel",
        include_map: true,
        include_tapu: true,
        include_imar: true
      });
      if (report.pdf_url) window.open(report.pdf_url, "_blank", "noopener,noreferrer");
      setReportStatus({
        state: report.pdf_url ? "generated" : "pending",
        message: report.pdf_url ? "PDF rapor hazır" : "Rapor hazırlanıyor — durumu kontrol edin",
        url: report.pdf_url,
        id: report.id
      });
    } catch (error) {
      setReportStatus({
        state: "error",
        message: humanizeApiError(error, "Rapor üretilemedi; API yanıtı beklenmeyen formatta.")
      });
    }
  }

  async function checkReportStatus() {
    if (!reportStatus.id) return;
    setReportStatus((current) => ({ ...current, state: "generating", message: "Rapor durumu kontrol ediliyor…" }));
    try {
      const report = await getBackendReport(reportStatus.id);
      setReportStatus({
        state: report.pdf_url ? "generated" : "pending",
        message: report.pdf_url ? "PDF rapor hazır" : `Rapor hazırlanıyor · durum: ${report.status}`,
        url: report.pdf_url,
        id: report.id
      });
    } catch (error) {
      setReportStatus({
        state: "error",
        message: humanizeApiError(error, "Rapor durumu alınamadı.")
      });
    }
  }


  function selectNearestParcelFromPoint() {
    const nearest = pointAnalysis?.nearestParcel;
    if (!nearest) return;
    setSelectedParcelId(nearest.parcel.id);
    setSelectedPoint(null);
    if (nearest.parcel.centroid) {
      flyTo({ center: nearest.parcel.centroid, zoom: 16.5, pitch: 48, bearing: -12 });
    }
    setOpen(true);
  }

  if (pointAnalysis && !parcel && !showLatestRegions) {
    return (
      <SelectedPointAnalysisPanel
        open={open}
        floating={floating}
        analysis={pointAnalysis}
        onClose={deselect}
        onSelectNearest={selectNearestParcelFromPoint}
      />
    );
  }

  if (showLatestRegions) {
    return (
      <AnimatePresence>
        {open && (
          <motion.aside
            key="latestregionspanel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
            className={cn(
            "fixed inset-x-0 bottom-0 top-auto z-30 flex max-h-[78dvh] flex-col rounded-t-xl md:inset-x-auto md:bottom-4 md:right-3 md:top-20 md:max-h-none md:rounded-xl",
              floating
                ? "w-full border border-border-strong/80 bg-surface-2/98 shadow-sheet md:w-[400px] md:shadow-[0_1px_0_rgb(255_255_255/0.72)_inset,0_22px_54px_-34px_rgb(18_52_82/0.56)] lg:w-[360px] xl:w-[400px]"
                : "w-full border border-border-strong/80 bg-surface-2/98 shadow-sheet md:w-[400px] md:shadow-[0_1px_0_rgb(255_255_255/0.72)_inset,0_22px_54px_-34px_rgb(18_52_82/0.56)]"
            )}
            aria-label="En yeni imar bölgeleri paneli"
          >
            <header className="flex flex-col gap-3 border-b border-border-subtle bg-[radial-gradient(circle_at_top_left,rgb(var(--accent-blue)/0.14),transparent_34%),rgb(var(--surface-1)/0.72)] px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-blue/35 bg-[rgb(var(--accent-blue)/0.11)] text-[rgb(var(--accent-blue))] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]">
                      <MapPinned className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-fg-muted">Canlı plan akışı</div>
                      <div className="text-lg font-semibold text-fg-primary">En Yeni İmar Bölgeleri</div>
                    </div>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-fg-secondary">
                    {latestRegionsMessage ?? "Belediye plan kayıtları listelenir; harita taşmasını önlemek için yalnız seçili ve geometrisi olan kayıt çizilir."}
                  </p>
                </div>
                <IconButton label="Kapat" variant="ghost" onClick={deselect}>
                  <X className="h-4 w-4" />
                </IconButton>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md border border-border-subtle bg-surface-2/85 px-2 py-2">
                  <div className="text-[9px] uppercase tracking-wider text-fg-muted">Kayıt</div>
                  <div className="mt-1 text-sm font-semibold text-fg-primary tabular-nums">{latestRegionsTotal}</div>
                </div>
                <div className="rounded-md border border-border-subtle bg-surface-2/85 px-2 py-2">
                  <div className="text-[9px] uppercase tracking-wider text-fg-muted">Geometri</div>
                  <div className="mt-1 flex items-baseline gap-1 text-sm font-semibold text-fg-primary tabular-nums">
                    {latestRegionsGeometryCount}
                    <span className="text-[10px] font-normal text-fg-muted">çizilebilir</span>
                  </div>
                </div>
                <div className="rounded-md border border-border-subtle bg-surface-2/85 px-2 py-2">
                  <div className="text-[9px] uppercase tracking-wider text-fg-muted">Kaynak</div>
                  <div className="mt-1"><SourceBadge status={latestRegionsStatus === "idle" || latestRegionsStatus === "loading" ? "computed" : latestRegionsStatus} /></div>
                </div>
              </div>
            </header>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">
                <div className="flex items-start gap-2 rounded-lg border border-brand-blue/25 bg-[rgb(var(--accent-blue)/0.07)] px-3 py-2 text-[11px] leading-relaxed text-fg-secondary">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--accent-blue))]" />
                  <span>Harita performansı için toplu poligon dökülmez. Bir satır seçildiğinde sadece o bölgenin geometrisi varsa vurgulanır; PDF/GML linkleri kaynak dokümanı gösterir.</span>
                </div>
                {latestRegionsItems.length === 0 ? (
                  <LatestRegionsEmptyState status={latestRegionsStatus} message={latestRegionsMessage} />
                ) : (
                  latestRegionsItems.map((item) => {
                    const selected = latestRegion?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          selectLatestRegion(item);
                          setOpen(true);
                        }}
                        className={cn(
                          "group relative w-full rounded-xl border px-3 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]",
                          selected
                            ? "border-brand-blue/70 bg-[linear-gradient(135deg,rgb(var(--accent-blue)/0.16),rgb(var(--surface-2)/0.96))] shadow-[inset_3px_0_0_rgb(var(--accent-blue)),0_0_0_1px_rgb(var(--accent-blue)/0.08)]"
                            : "border-border-subtle bg-surface-2/92 hover:border-border-strong hover:bg-surface-1"
                        )}
                        aria-pressed={selected}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-fg-muted">
                              <span>{item.municipality_name || "Belediye kaydı"}</span>
                              {selected && <span className="text-[rgb(var(--accent-blue))]">Seçili</span>}
                            </div>
                            <div className="mt-1 text-sm font-semibold leading-snug text-fg-primary line-clamp-2">{item.label}</div>
                            <div className="mt-1 text-[11px] text-fg-secondary">
                              {[item.district, item.province].filter(Boolean).join(" / ") || item.municipality_name || "Konum bilgisi sınırlı"}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <SourceBadge status={item.source} className="h-4 px-1.5 text-[8px]" />
                            <SourceBadge status={item.has_geometry ? "computed" : "unavailable"} label={item.has_geometry ? "çizilebilir" : "geometri yok"} className="h-4 px-1.5 text-[8px]" />
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                          <LatestRegionFact label="Plan" value={item.plan_type ?? "Tür belirtilmedi"} />
                          <LatestRegionFact label="Durum" value={item.status ?? "Durum yok"} />
                          <LatestRegionFact label="Askı başlangıç" value={item.aski_start ? formatDate(item.aski_start) : "—"} />
                          <LatestRegionFact label="Askı bitiş" value={item.aski_end ? formatDate(item.aski_end) : "—"} />
                        </div>
                        {(item.pdf_url || item.gml_url) && (
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-fg-secondary">
                            {item.pdf_url && <span className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-1 px-2 py-1"><FileText className="h-3 w-3" /> PDF plan</span>}
                            {item.gml_url && <span className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-1 px-2 py-1"><MapPinned className="h-3 w-3" /> GML geometri</span>}
                          </div>
                        )}
                        {!item.has_geometry && (
                          <div className="mt-3 flex items-start gap-1.5 rounded-md border border-status-warning/25 bg-status-warning/10 px-2 py-1.5 text-[11px] leading-snug text-status-warning">
                            <MapPinOff className="mt-0.5 h-3 w-3 shrink-0" />
                            <span>Kaynak kaydı var; belediye geometri yayımlamadığı için haritaya çizilmiyor.</span>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="rightpanel"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
          className={cn(
            "fixed bottom-4 right-3 top-20 z-30 flex flex-col overflow-hidden rounded-xl",
            floating
              ? "w-[400px] border border-border-strong/80 bg-surface-2/98 shadow-[0_1px_0_rgb(255_255_255/0.72)_inset,0_22px_54px_-34px_rgb(18_52_82/0.56)] lg:w-[360px] xl:w-[400px]"
              : "w-[400px] border border-border-strong/80 bg-surface-2/98 shadow-[0_1px_0_rgb(255_255_255/0.72)_inset,0_22px_54px_-34px_rgb(18_52_82/0.56)]"
          )}
          aria-label="Parsel detay paneli"
        >
          <header className="flex flex-col gap-3 border-b border-border-subtle/80 bg-surface-3/65 px-4 py-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                  Ada/Parsel
                </span>
                <span className="text-2xl font-semibold tracking-[-0.035em] tabular-nums text-fg-primary">
                  {adaParselText(parcelData!.ada, parcelData!.parsel)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <IconButton
                  label={isWatchlisted ? "Parsel Alarm'dan çıkar" : "Parsel Alarm'a ekle"}
                  variant="ghost"
                  onClick={toggleWatchlist}
                >
                  <Star
                    className={cn(
                      "h-4 w-4",
                      isWatchlisted
                        ? "fill-[rgb(var(--accent-red))] text-[rgb(var(--accent-red))]"
                        : "text-fg-muted"
                    )}
                  />
                </IconButton>
                <IconButton label="Paylaş" variant="ghost">
                  <Share2 className="h-4 w-4" />
                </IconButton>
                <IconButton label="Kapat" variant="ghost" onClick={deselect}>
                  <X className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex min-w-0 items-center gap-2 text-xs text-fg-secondary">
                <span className="truncate">
                  {parcelData!.mahalle} · {parcelData!.ilce} / {parcelData!.il}
                </span>
                <SourceBadge status={parcelData!.sourceStatus ?? "demo"} />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ZoningBadge type={parcelData!.zoningType} size="xs" />
                <span className="text-[11px] tabular-nums text-fg-muted">
                  {formatArea(parcelData!.yuzolcumuM2)}
                </span>
              </div>
            </div>
            {multiSelectedParcelIds.length > 0 && (
              <div className="flex items-center justify-between gap-2 rounded-md border border-[rgb(var(--accent-blue))]/30 bg-[rgb(var(--accent-blue)/0.08)] px-2.5 py-2 text-xs">
                <span className="inline-flex items-center gap-1.5 text-fg-primary"><GitCompareArrows className="h-3.5 w-3.5" /> {multiSelectedParcelIds.length} parsel seçili</span>
                <div className="flex items-center gap-2">
                  <button type="button" className="font-medium text-fg-primary underline underline-offset-2">Kart açık</button>
                  <button type="button" onClick={clearMultiSelection} className="text-fg-muted hover:text-fg-primary">Temizle</button>
                </div>
              </div>
            )}
            <ParcelWorkflowStrip
              parcel={parcelData!}
              hasGeometry={Boolean(backendGeometry) || Boolean(parcelData!.centroid)}
              geometrySource={backendGeometry ? "live" : parcelData!.centroid ? "demo" : "unavailable"}
              reportState={reportStatus.state}
            />
          </header>

          {panelLoading ? (
            <ParcelPanelSkeleton />
          ) : (
            <>
          <section className="grid grid-cols-3 gap-2 border-b border-border-subtle/80 bg-bg/45 px-3 py-3">
            <MetricCard
              icon={<Building2 className="h-3.5 w-3.5" />}
              label="Yapı Potansiyeli"
              value={`${Math.round(parcelData!.yuzolcumuM2 * parcelData!.kaks).toLocaleString("tr-TR")} m²`}
              hint={`KAKS ${parcelData!.kaks.toFixed(2)} · TAKS ${parcelData!.taks.toFixed(2)}`}
            />
            <MetricCard
              icon={<ShieldAlert className="h-3.5 w-3.5" />}
              label="Risk Bileşimi"
              value={`D${parcelData!.riskler.deprem} · S${parcelData!.riskler.sel}`}
              hint={`Heyelan ${parcelData!.riskler.heyelan} · Yangın ${parcelData!.riskler.yangin}`}
            />
            <MetricCard
              icon={<Route className="h-3.5 w-3.5" />}
              label="Erişilebilirlik"
              value={`${Math.round(parcelData!.cevre.ulasimSkoru)}/100`}
              hint={`Metro ${Math.round(parcelData!.cevre.metroM)} m · Park ${Math.round(parcelData!.cevre.parkM)} m`}
            />
          </section>

          <ParcelShareSummaryCard
            parcel={parcelData!}
            summary={parcelSummary}
            context={parcelContext}
            status={parcelContextStatus}
            geometrySource={backendGeometry ? "live" : parcelData!.centroid ? "demo" : "unavailable"}
          />
          {comparisonParcels.length >= 2 && (
            <ParcelComparisonCard parcels={comparisonParcels} onClear={clearMultiSelection} />
          )}

          <ScrollArea className="flex-1">
            {!backendGeometry && parcelData!.backendId && (
              <div className="mx-3 mt-3 rounded-md border border-status-warning/40 bg-status-warning/10 px-3 py-2 text-[11px] text-status-warning">
                Geometri yok — haritada yaklaşık konum gösterilemiyor.
              </div>
            )}
            <Accordion
              type="multiple"
              defaultValue={["ai-analiz", "guven", "ilgili-planlar", "konum", "imar"]}
              className="divide-y divide-border-subtle"
            >
              {pointAnalysis && (
                <AccordionItem value="ai-analiz">
                  <AccordionTrigger>Yer analizi</AccordionTrigger>
                  <AccordionContent>
                    <SelectedPointAnalysisContent analysis={pointAnalysis} compact padded={false} />
                  </AccordionContent>
                </AccordionItem>
              )}
              <AccordionItem value="guven">
                <AccordionTrigger>Veri Kaynakları & Güven</AccordionTrigger>
                <AccordionContent>
                  <TrustSection
                    parcel={parcelData!}
                    geometrySource={backendGeometry ? "live" : parcelData!.centroid ? "demo" : "unavailable"}
                    imarSource={parcelData!.backendId && backendResponse ? "fallback" : trustStatus(parcelData!.sourceStatus)}
                    askiStatus={askiStatus}
                    liveAskiCount={askiPlans.length}
                    lastCheckedAt={askiLastCheckedAt}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ilgili-planlar">
                <AccordionTrigger>İlgili plan / askı önerileri</AccordionTrigger>
                <AccordionContent>
                  <RelatedPlansSection context={parcelContext} status={parcelContextStatus} onSelectGeometry={selectRelatedPlan} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="konum">
                <AccordionTrigger>Konum & Tapu</AccordionTrigger>
                <AccordionContent>
                  <SectionKonum parcel={parcelData!} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="imar">
                <AccordionTrigger>İmar Durumu</AccordionTrigger>
                <AccordionContent>
                  <SectionImar parcel={parcelData!} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="plan-notlari">
                <AccordionTrigger>Plan Notları</AccordionTrigger>
                <AccordionContent>
                  <SectionPlanNotlari parcel={parcelData!} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="riskler">
                <AccordionTrigger>Riskler</AccordionTrigger>
                <AccordionContent>
                  <SectionRiskler parcel={parcelData!} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="aski">
                <AccordionTrigger>Askı Durumu</AccordionTrigger>
                <AccordionContent>
                  <SectionAski parcel={parcelData!} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cevre">
                <AccordionTrigger>Çevre & Erişilebilirlik</AccordionTrigger>
                <AccordionContent>
                  <SectionCevre parcel={parcelData!} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="gecmis">
                <AccordionTrigger>Geçmiş & Plan Değişiklikleri</AccordionTrigger>
                <AccordionContent>
                  <SectionGecmis parcel={parcelData!} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="yatirim">
                <AccordionTrigger>Yatırım Skoru</AccordionTrigger>
                <AccordionContent>
                  <SectionYatirimSkoru parcel={parcelData!} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="piyasa">
                <AccordionTrigger>Market Cockpit</AccordionTrigger>
                <AccordionContent>
                  {marketLoading && !marketResponse ? (
                    <div className="rounded-md border border-border-subtle bg-surface-1/50 px-3 py-4 text-sm text-fg-secondary">
                      Market payload yükleniyor…
                    </div>
                  ) : (
                    <MarketPanel response={marketResponse} />
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>

          <footer className="grid grid-cols-2 gap-2 px-3 py-3 border-t border-border-subtle bg-surface-1/40">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEmsalOpen(true)}
              className="col-span-1"
            >
              <Calculator className="h-4 w-4" /> Emsal Hesapla
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateReport}
                    disabled={reportStatus.state === "generating"}
                    className="w-full"
                  >
                    {reportStatus.state === "generating" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )} Parsel Raporu
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <span className="inline-flex items-center gap-1">
                    {parcelData!.backendId ? "Canlı parsel raporu üret; eksik geometri/plan uyarıları özet kartında görünür" : "Canlı API parseli olmadan resmi rapor üretilemez"}
                </span>
              </TooltipContent>
            </Tooltip>
            {reportStatus.message && (
              <div
                className={cn(
                  "col-span-2 rounded-md border px-2.5 py-1.5 text-[11px]",
                  reportStatus.state === "generated"
                    ? "border-status-success/40 bg-status-success/10 text-status-success"
                    : reportStatus.state === "error"
                    ? "border-status-warning/40 bg-status-warning/10 text-status-warning"
                    : "border-border-subtle bg-surface-2 text-fg-muted"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{reportStatus.message}</span>
                  {reportStatus.url ? (
                  <a href={reportStatus.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 font-medium">
                    PDF aç
                  </a>
                ) : reportStatus.id && reportStatus.state === "pending" ? (
                  <button type="button" onClick={checkReportStatus} className="underline underline-offset-2 font-medium">
                    Durumu kontrol et
                  </button>
                ) : (
                  null
                )}
                </div>
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleWatchlist}
              disabled={watchlistStatus.state === "loading"}
              className="col-span-1"
            >
              {watchlistStatus.state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <Star
                className={cn(
                  "h-4 w-4",
                  isWatchlisted &&
                    "fill-[rgb(var(--accent-red))] text-[rgb(var(--accent-red))]"
                )}
              />)}
              {isWatchlisted ? "Alarmdan çıkar" : "Parsel Alarm'a ekle"}
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" /> Özeti paylaş
            </Button>
            {watchlistStatus.message && (
              <div
                className={cn(
                  "col-span-2 rounded-md border px-2.5 py-1.5 text-[11px]",
                  watchlistStatus.state === "error"
                    ? "border-status-warning/40 bg-status-warning/10 text-status-warning"
                    : "border-border-subtle bg-surface-2 text-fg-muted"
                )}
              >
                {watchlistStatus.message}
              </div>
            )}
          </footer>
            </>
          )}

          <EmsalCalculatorPanel
            open={emsalOpen}
            onOpenChange={setEmsalOpen}
            parcel={parcelData!}
          />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}


function SelectedPointAnalysisPanel({
  open,
  floating,
  analysis,
  onClose,
  onSelectNearest
}: {
  open: boolean;
  floating: boolean;
  analysis: SelectedPlaceAnalysis;
  onClose: () => void;
  onSelectNearest: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="selectedpointpanel"
          initial={{ x: "100%", opacity: 0.92 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0.92 }}
          transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
          className={cn(
            "fixed right-3 top-20 z-30 flex max-h-[min(calc(100dvh-7rem),680px)] flex-col overflow-hidden rounded-2xl border border-border-strong bg-surface-2 shadow-[0_1px_0_rgb(255_255_255/0.82)_inset,0_28px_70px_-42px_rgb(18_52_82/0.68)] ring-1 ring-white/45 backdrop-blur-md",
            floating ? "w-[min(360px,calc(100vw-1.5rem))] xl:w-[380px]" : "w-[min(380px,calc(100vw-1.5rem))]"
          )}
          aria-label="Seçili nokta analizi paneli"
        >
          <header className="relative overflow-hidden border-b border-border-subtle/80 bg-surface-3 px-3.5 py-3">
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-blue/25 bg-[rgb(var(--accent-blue)/0.10)] text-[rgb(var(--accent-blue))] shadow-[inset_0_1px_0_rgb(255_255_255/0.78)]">
                    <Crosshair className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">Yer analizi</div>
                    <h2 className="text-base font-semibold tracking-[-0.02em] text-fg-primary">{analysis.title}</h2>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-fg-secondary">{analysis.subtitle}</p>
              </div>
              <IconButton label="Kapat" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>
            <div className="relative mt-3 grid grid-cols-2 gap-2">
              <GlassMetric icon={<Crosshair className="h-3.5 w-3.5" />} label="Koordinat" value={analysis.coordinateLabel} />
              <GlassMetric icon={<Navigation className="h-3.5 w-3.5" />} label="Seçim" value={analysis.sourceLabel} />
            </div>
          </header>

          <ScrollArea className="flex-1">
            <SelectedPointAnalysisContent analysis={analysis} compact onSelectNearest={onSelectNearest} />
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function SelectedPointAnalysisContent({
  analysis,
  compact = false,
  padded = true,
  onSelectNearest
}: {
  analysis: SelectedPlaceAnalysis;
  compact?: boolean;
  padded?: boolean;
  onSelectNearest?: () => void;
}) {
  const bulletLimit = compact ? 2 : 3;
  return (
    <div className={cn(compact ? (padded ? "space-y-2.5 p-3" : "space-y-2.5 p-0") : "space-y-3 p-3")}>
      <div className={cn(
        "rounded-xl border border-[rgb(var(--status-warning)/0.35)] bg-[rgb(var(--status-warning)/0.10)] text-fg-secondary",
        compact ? "px-2.5 py-2 text-[10.5px] leading-snug" : "px-3 py-2 text-[11px] leading-relaxed"
      )}>
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{analysis.disclaimer}</span>
        </div>
      </div>

      {analysis.nearestParcel && onSelectNearest && (
        <button
          type="button"
          onClick={onSelectNearest}
          className={cn(
            "group flex w-full items-center justify-between gap-3 rounded-xl border border-brand-blue/25 bg-[rgb(var(--accent-blue)/0.09)] text-left transition hover:border-brand-blue/45 hover:bg-[rgb(var(--accent-blue)/0.13)]",
            compact ? "min-h-10 px-2.5 py-2" : "min-h-11 px-3 py-3"
          )}
        >
          <span>
            <span className="block text-xs font-semibold text-fg-primary">
              Yakın parseli seç: {adaParselText(analysis.nearestParcel.parcel.ada, analysis.nearestParcel.parcel.parsel)}
            </span>
            <span className="mt-1 block text-[11px] text-fg-secondary">
              {analysis.nearestParcel.distanceM.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} m · {analysis.nearestParcel.parcel.mahalle}
            </span>
          </span>
          <MapPinned className="h-4 w-4 text-[rgb(var(--accent-blue))] transition group-hover:scale-110" />
        </button>
      )}

      <div className="grid gap-2">
        {analysis.insights.map((card, index) => (
          <InsightCard key={card.id} card={card} index={index} compact={compact} bulletLimit={bulletLimit} />
        ))}
      </div>
    </div>
  );
}

function InsightCard({
  card,
  index,
  compact = false,
  bulletLimit = 3
}: {
  card: PlaceInsightCard;
  index: number;
  compact?: boolean;
  bulletLimit?: number;
}) {
  return (
    <motion.article
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.035, 0.18) }}
      className={cn(
        "rounded-xl border bg-surface-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.72)]",
        compact ? "p-2.5" : "p-3",
        insightToneClass(card.tone)
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-fg-muted">
            {insightIcon(card.kind)}
            <span>{card.title}</span>
          </div>
          <div className={cn("mt-1 font-semibold text-fg-primary", compact ? "text-sm" : "text-base")}>{card.value}</div>
          <p className={cn("mt-1 text-xs text-fg-secondary", compact ? "line-clamp-2 leading-snug" : "leading-relaxed")}>{card.detail}</p>
        </div>
        <SourceBadge status={card.provenance === "derived" ? "computed" : card.provenance} className="shrink-0" />
      </div>
      <ul className={cn("text-[11px] text-fg-secondary", compact ? "mt-2 space-y-1 leading-snug" : "mt-3 space-y-1.5 leading-relaxed")}>
        {card.bullets.slice(0, bulletLimit).map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[rgb(var(--accent-blue))]" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

function GlassMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border-subtle bg-surface-2 px-3 py-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.72)]">
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] text-fg-muted">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 truncate text-xs font-semibold text-fg-primary">{value}</div>
    </div>
  );
}

function insightToneClass(tone: PlaceInsightCard["tone"]) {
  switch (tone) {
    case "good":
      return "border-status-success/30 bg-[rgb(var(--status-success)/0.06)]";
    case "warning":
      return "border-status-warning/35 bg-[rgb(var(--status-warning)/0.06)]";
    case "danger":
      return "border-status-error/30 bg-[rgb(var(--status-error)/0.055)]";
    case "info":
      return "border-brand-blue/25 bg-[rgb(var(--accent-blue)/0.055)]";
    case "muted":
    default:
      return "border-border-subtle";
  }
}

function insightIcon(kind: PlaceInsightCard["kind"]) {
  switch (kind) {
    case "potential":
      return <Building2 className="h-3.5 w-3.5" />;
    case "risk":
      return <ShieldAlert className="h-3.5 w-3.5" />;
    case "mobility":
      return <Route className="h-3.5 w-3.5" />;
    case "confidence":
      return <Database className="h-3.5 w-3.5" />;
    case "opportunity":
      return <FileSearch className="h-3.5 w-3.5" />;
    case "zoning":
    default:
      return <MapPinned className="h-3.5 w-3.5" />;
  }
}

function MetricCard({
  icon,
  label,
  value,
  hint
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="min-w-0 rounded-lg border border-border-subtle bg-surface-2 px-2.5 py-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.72)]">
      <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-fg-muted">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 text-xs font-semibold tabular-nums text-fg-primary truncate">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-fg-muted leading-snug">
        {hint}
      </p>
    </article>
  );
}

function LatestRegionFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-border-subtle bg-surface-1/70 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-fg-muted">{label}</div>
      <div className="mt-0.5 truncate text-[11px] font-medium text-fg-secondary">{value}</div>
    </div>
  );
}

function LatestRegionsEmptyState({
  status,
  message
}: {
  status: "idle" | "loading" | DataSourceStatus;
  message?: string;
}) {
  const loading = status === "loading";
  const unavailable = status === "unavailable";
  return (
    <div
      role={loading ? "status" : undefined}
      className={cn(
        "rounded-xl border px-3 py-4",
        unavailable
          ? "border-status-warning/35 bg-status-warning/10"
          : "border-border-subtle bg-surface-1/55"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
            loading
              ? "border-brand-blue/35 bg-[rgb(var(--accent-blue)/0.10)] text-[rgb(var(--accent-blue))]"
              : unavailable
              ? "border-status-warning/35 bg-status-warning/10 text-status-warning"
              : "border-border-subtle bg-surface-2 text-fg-muted"
          )}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : unavailable ? <TriangleAlert className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-fg-primary">
            {loading ? "Canlı kayıtlar yükleniyor" : unavailable ? "Kaynak şu an yanıt vermiyor" : "Gösterilecek yeni bölge yok"}
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-fg-secondary">
            {message ?? (loading ? "Belediye/API kayıtları sorgulanıyor; geometri olan ilk kayıt seçilince haritada görünecek." : unavailable ? "Liste alınamadı; parsel arama, katmanlar ve yerel yedek akışlar çalışmaya devam eder." : "Filtreler veya kaynak kayıtları yeni plan bölgesi döndürmedi. Parsel araması ve askı katmanı etkilenmez.")}
          </p>
        </div>
      </div>
    </div>
  );
}

function ParcelPanelSkeleton() {
  return (
    <div className="flex-1 space-y-3 px-3 py-3">
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((item) => (
          <SkeletonBlock key={item} className="h-[72px]" />
        ))}
      </div>
      <SkeletonBlock className="h-28" />
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <SkeletonBlock key={item} className="h-16" />
        ))}
      </div>
      <div className="rounded-md border border-border-subtle bg-surface-1/60 px-3 py-2 text-[11px] text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Parsel detay kartları hazırlanıyor…
        </span>
      </div>
    </div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-md border border-border-subtle bg-surface-2", className)}>
      <div className="h-full w-1/2 animate-[skeleton-pan_1.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <style>{`@keyframes skeleton-pan {
        0% { transform: translateX(-120%); }
        100% { transform: translateX(260%); }
      }`}</style>
    </div>
  );
}

function ParcelComparisonCard({
  parcels,
  onClear
}: {
  parcels: Array<NonNullable<ReturnType<typeof getParcelById>>["properties"]>;
  onClear: () => void;
}) {
  return (
    <section className="border-b border-border-subtle bg-surface-2 px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-primary">
            <GitCompareArrows className="h-3.5 w-3.5 text-fg-muted" />
            Parsel karşılaştırma
          </div>
          <p className="mt-0.5 text-[11px] text-fg-muted">2-4 seçili parsel; demo/derived değerler açık etiketlenir.</p>
        </div>
        <button type="button" onClick={onClear} className="text-[11px] font-medium text-fg-muted underline underline-offset-2 hover:text-fg-primary">
          Temizle
        </button>
      </div>
      <div className="grid gap-2">
        {parcels.map((item) => (
          <article key={item.id} className="rounded-md border border-border-subtle bg-surface-1 px-2.5 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold tabular-nums text-fg-primary">{adaParselText(item.ada, item.parsel)}</span>
              <SourceBadge status={item.sourceStatus ?? "demo"} className="h-4 px-1.5 text-[8px]" />
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5 text-[10px]">
              <CompareMetric label="Alan" value={formatArea(item.yuzolcumuM2)} />
              <CompareMetric label="TAKS" value={item.taks > 0 ? item.taks.toFixed(2) : "unavailable"} />
              <CompareMetric label="KAKS" value={item.kaks > 0 ? item.kaks.toFixed(2) : "unavailable"} />
              <CompareMetric label="Risk" value={`D${item.riskler.deprem}/S${item.riskler.sel}`} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ParcelShareSummaryCard({
  parcel,
  summary,
  context,
  status,
  geometrySource
}: {
  parcel: NonNullable<ReturnType<typeof useParcel>>["properties"];
  summary: ParcelSummaryResponse | null;
  context: ParcelContextResponse | null;
  status: { state: "idle" | "loading" | "ready" | "unavailable"; message?: string };
  geometrySource: "live" | "demo" | "unavailable";
}) {
  const relatedPlanCount = summary?.related_plan_count ?? context?.related_plans.length ?? 0;
  const relatedAskiCount = summary?.related_aski_count ?? context?.active_aski_plans.length ?? 0;
  const generatedAt = summary?.generated_at ?? context?.generated_at;
  const sourceTrust = summary?.source_trust;
  const sourceStatus = sourceTrust?.source_status ?? parcel.sourceStatus ?? "demo";
  const geometryStatus = summary?.geometry_status === "available" || geometrySource !== "unavailable";
  return (
    <section className="border-b border-border-subtle bg-[radial-gradient(circle_at_top_right,rgb(var(--accent-blue)/0.12),transparent_42%),rgb(var(--surface-1)/0.46)] px-3 py-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-primary">
            <FileText className="h-3.5 w-3.5 text-[rgb(var(--accent-blue))]" />
            Parsel özet / paylaşım kartı
          </div>
          <p className="mt-0.5 text-[11px] leading-snug text-fg-muted">
            Rapor öncesi kaynak, geometri ve plan uyarıları tek kartta; endpoint yoksa durum açık gösterilir.
          </p>
        </div>
        <SourceBadge status={sourceStatus} label={sourceStatusLabel(sourceStatus)} className="shrink-0" />
      </div>
      <div className="rounded-xl border border-border-subtle bg-surface-2/88 p-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.035)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-fg-muted">Ada/Parsel</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums text-fg-primary">{adaParselText(parcel.ada, parcel.parsel)}</div>
            <div className="mt-1 truncate text-[11px] text-fg-secondary">
              {[summary?.location.mahalle ?? parcel.mahalle, summary?.location.ilce ?? parcel.ilce, summary?.location.il ?? parcel.il].filter(Boolean).join(" / ")}
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-1.5 text-[10px]">
            <ShareMetric label="Plan" value={String(relatedPlanCount)} />
            <ShareMetric label="Askı" value={String(relatedAskiCount)} />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ShareFact label="Kaynak güveni" value={sourceTrust?.source_name ?? sourceTrust?.provider ?? sourceStatusLabel(sourceStatus)} status={sourceStatus} />
          <ShareFact label="Geometri" value={summary?.geometry_status ? geometryLabel(summary.geometry_status === "available") : geometryLabel(geometryStatus)} status={geometryStatus ? geometrySource : "unavailable"} />
          <ShareFact label="Rapor" value={reportEligibilityLabel(summary?.report_eligibility)} status={summary?.report_eligibility === "limited" ? "fallback" : parcel.backendId ? "computed" : "unavailable"} />
          <ShareFact label="Üretim" value={generatedAt ? formatQualityTimestamp(generatedAt) : status.state === "loading" ? "hazırlanıyor" : "endpoint yok"} status={generatedAt ? "public_metadata" : status.state === "loading" ? "computed" : "unavailable"} />
        </div>
        {(summary?.warnings?.length || status.message) && (
          <div className="mt-3 rounded-md border border-status-warning/30 bg-status-warning/10 px-2.5 py-2 text-[11px] leading-snug text-status-warning">
            {summary?.warnings?.length ? summary.warnings.slice(0, 2).join(" · ") : status.message}
          </div>
        )}
      </div>
    </section>
  );
}

function ShareMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[54px] rounded-md border border-border-subtle bg-surface-1 px-2 py-1.5 text-center">
      <div className="text-[9px] uppercase tracking-wider text-fg-muted">{label}</div>
      <div className="mt-0.5 font-semibold tabular-nums text-fg-primary">{value}</div>
    </div>
  );
}

function ShareFact({
  label,
  value,
  status
}: {
  label: string;
  value: string;
  status: DataSourceStatus | "live" | "fallback" | "demo" | "unavailable";
}) {
  return (
    <div className="min-w-0 rounded-md border border-border-subtle bg-surface-1/70 px-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[9px] uppercase tracking-wider text-fg-muted">{label}</span>
        <SourceBadge status={status} className="h-4 px-1 text-[8px]" />
      </div>
      <div className="mt-1 truncate text-[11px] font-medium text-fg-primary">{value}</div>
    </div>
  );
}

function RelatedPlansSection({
  context,
  status,
  onSelectGeometry
}: {
  context: ParcelContextResponse | null;
  status: { state: "idle" | "loading" | "ready" | "unavailable"; message?: string };
  onSelectGeometry: (item: RelatedPlanItem) => void;
}) {
  const items = [
    ...(context?.active_aski_plans ?? []),
    ...(context?.related_plans ?? []).filter((item) => !(context?.active_aski_plans ?? []).some((aski) => aski.id === item.id))
  ].slice(0, 6);
  if (status.state === "loading") {
    return <div className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-3 text-[12px] text-fg-secondary">İlgili plan ve askı kayıtları sorgulanıyor…</div>;
  }
  if (!context || items.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-3">
        <div className="text-sm font-semibold text-fg-primary">Eşleşen plan/askı yok</div>
        <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">
          {status.message ?? "Backend spatial/municipality/district eşleşmesi kayıt döndürmedi; öneri uydurulmadı."}
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="rounded-md border border-border-subtle bg-surface-2 px-3 py-2 text-[11px] leading-relaxed text-fg-secondary">
        Eşleşme yöntemi: <span className="font-semibold text-fg-primary">{matchStatusLabel(context.match_method)}</span>. Haritada yalnız tıklanan ve geometrisi olan kayıt çizilir.
      </div>
      {items.map((item) => (
        <article key={`${item.relation}-${item.id}`} className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wider text-fg-muted">
                <span>{matchStatusLabel(item.relation)}</span>
                {item.status && <span>· {item.status}</span>}
              </div>
              <div className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-fg-primary">{item.label}</div>
              <div className="mt-1 text-[11px] text-fg-secondary">{[item.district, item.province].filter(Boolean).join(" / ") || item.municipality_name || "Konum sınırlı"}</div>
            </div>
            <SourceBadge status={item.has_geometry ? "computed" : "unavailable"} label={item.has_geometry ? "geom var" : "geom yok"} className="shrink-0 h-4 px-1.5 text-[8px]" />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
            <LatestRegionFact label="Plan" value={item.plan_type ?? "Tür yok"} />
            <LatestRegionFact label="Askı" value={[item.aski_start ? formatDate(item.aski_start) : null, item.aski_end ? formatDate(item.aski_end) : null].filter(Boolean).join(" – ") || "Pencere yok"} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            {item.pdf_url && <a className="rounded border border-border-subtle px-2 py-1 text-fg-secondary underline-offset-2 hover:text-fg-primary hover:underline" href={item.pdf_url} target="_blank" rel="noreferrer">PDF</a>}
            {item.gml_url && <a className="rounded border border-border-subtle px-2 py-1 text-fg-secondary underline-offset-2 hover:text-fg-primary hover:underline" href={item.gml_url} target="_blank" rel="noreferrer">GML</a>}
            <button
              type="button"
              disabled={!item.has_geometry}
              onClick={() => onSelectGeometry(item)}
              className="rounded border border-brand-blue/35 px-2 py-1 text-[rgb(var(--accent-blue))] disabled:border-border-subtle disabled:text-fg-muted"
            >
              {item.has_geometry ? "Bu geometriyi göster" : "Geometri yok"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function CompareMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-1">
      <div className="uppercase tracking-wider text-fg-muted">{label}</div>
      <div className="mt-0.5 truncate font-semibold tabular-nums text-fg-primary">{value}</div>
    </div>
  );
}
function ParcelWorkflowStrip({
  parcel,
  hasGeometry,
  geometrySource,
  reportState
}: {
  parcel: NonNullable<ReturnType<typeof useParcel>>["properties"];
  hasGeometry: boolean;
  geometrySource: "live" | "demo" | "unavailable";
  reportState: "idle" | "generating" | "generated" | "pending" | "error";
}) {
  const imarKnown = parcel.taks > 0 || parcel.kaks > 0 || parcel.gabariM > 0;
  const ready3d = hasGeometry && (parcel.gabariM > 0 || parcel.kaks > 0);
  const steps = [
    { label: "Parsel", status: parcel.sourceStatus ?? "demo", text: parcel.sourceStatus === "live" ? "canlı" : parcel.sourceStatus === "fallback" ? "yedek" : "demo" },
    { label: "Geometri", status: geometrySource, text: geometrySource === "live" ? "canlı" : geometrySource === "demo" ? "yerel" : "yok" },
    { label: "İmar", status: imarKnown ? (parcel.backendId ? "fallback" : "demo") : "unavailable", text: imarKnown ? (parcel.backendId ? "yerel" : "demo") : "bilinmiyor" },
    { label: "Rapor", status: reportState === "generated" ? "live" : reportState === "error" ? "unavailable" : reportState === "generating" || reportState === "pending" ? "computed" : parcel.backendId ? "computed" : "unavailable", text: reportState === "generated" ? "hazır" : reportState === "generating" ? "üretiliyor" : reportState === "pending" ? "bekliyor" : parcel.backendId ? "hazır" : "API gerek" },
    { label: "3D", status: ready3d ? "computed" : "unavailable", text: ready3d ? "hazır" : "eksik" }
  ] as const;
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {steps.map((step) => (
        <div key={step.label} className="rounded-md border border-border-subtle bg-surface-2/80 px-1.5 py-1">
          <div className="text-[9px] uppercase tracking-wider text-fg-muted">{step.label}</div>
          <SourceBadge status={step.status} label={step.text} className="mt-1 h-4 px-1 text-[8px]" />
        </div>
      ))}
    </div>
  );
}

function TrustSection({
  parcel,
  geometrySource,
  imarSource,
  askiStatus,
  liveAskiCount,
  lastCheckedAt
}: {
  parcel: NonNullable<ReturnType<typeof useParcel>>["properties"];
  geometrySource: "live" | "demo" | "unavailable";
  imarSource: "live" | "fallback" | "demo" | "unavailable";
  askiStatus: "idle" | "loading" | "live" | "fallback" | "unavailable";
  liveAskiCount: number;
  lastCheckedAt?: string;
}) {
  const lastChecked = lastCheckedAt ? new Date(lastCheckedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "Bu oturumda yok";
  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border-subtle bg-surface-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.03)]">
        <TrustRow label="Parsel kaynağı" status={trustStatus(parcel.sourceStatus)} detail={statusDetail(trustStatus(parcel.sourceStatus), "Parsel kimliği")} />
        <TrustRow label="Geometri" status={geometrySource} detail={statusDetail(geometrySource, "Harita çizimi")} />
        <TrustRow label="İmar" status={imarSource} detail={statusDetail(imarSource, "Plan koşulları")} />
        <TrustRow label="Risk/Çevre" status="demo" labelOverride="Demo/Tahmini" detail="Canlı resmi risk servisi değildir; karar desteği için bağlamsal katman." />
        <div className="flex items-center justify-between gap-2 border-t border-border-subtle px-3 py-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-fg-secondary"><Clock3 className="h-3.5 w-3.5" /> Son kontrol</span>
          <span className="text-fg-muted tabular-nums">{lastChecked}</span>
        </div>
      </div>
      <div className="flex items-start gap-2 rounded-md border border-border-subtle bg-surface-1/50 px-3 py-2 text-[11px] text-fg-muted">
        <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Askı API: {askiStatus === "live" ? `${liveAskiCount} canlı kayıt` : askiStatus === "loading" ? "yenileniyor" : askiStatus === "unavailable" ? "erişilemiyor" : "yerel/demo katman"}.
        </span>
      </div>
    </div>
  );
}

function TrustRow({
  label,
  status,
  labelOverride,
  detail
}: {
  label: string;
  status: "live" | "fallback" | "demo" | "unavailable";
  labelOverride?: string;
  detail?: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-2 border-b last:border-b-0 border-border-subtle px-3 py-2 text-xs">
      <span className="min-w-0">
        <span className="block font-medium text-fg-secondary">{label}</span>
        {detail && <span className="mt-0.5 block text-[11px] leading-snug text-fg-muted">{detail}</span>}
      </span>
      <SourceBadge status={status} label={labelOverride} className="self-start" />
    </div>
  );
}

function statusDetail(status: "live" | "fallback" | "demo" | "unavailable", subject: string) {
  if (status === "live") return `${subject} canlı kaynaktan doğrulandı.`;
  if (status === "fallback") return `${subject} için yerel yedek/önbellek kullanılıyor.`;
  if (status === "unavailable") return `${subject} şu an kaynak tarafından sağlanmıyor.`;
  return `${subject} demo veya tahmini veriyle gösteriliyor.`;
}

function trustStatus(status: DataSourceStatus | undefined) {
  return status === "live" || status === "fallback" || status === "unavailable" || status === "demo"
    ? status
    : "demo";
}
