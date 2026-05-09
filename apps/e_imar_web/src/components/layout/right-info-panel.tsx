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
  Building2,
  ShieldAlert,
  Route,
  MapPinned,
  ExternalLink,
  Sparkles,
  Crosshair,
  WandSparkles,
  AlertTriangle,
  Navigation,
  CheckCircle2
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
import type { DataSourceStatus } from "@/types/api";
import {
  createBackendWatchlistItem,
  generateBackendReport,
  getBackendReport,
  humanizeApiError
} from "@/lib/api/backend-client";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";
import { useParcel } from "@/hooks/use-parcel";
import { useWatchlistStore } from "@/stores/watchlist-store";
import { useBackendParcelStore } from "@/stores/backend-parcel-store";
import { useAskiStore } from "@/stores/aski-store";
import { useLatestRegionsStore } from "@/stores/latest-regions-store";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmsalCalculatorPanel } from "@/components/emsal/emsal-calculator-panel";
import {
  buildSelectedPlaceAnalysis,
  type PlaceInsightCard,
  type SelectedPlaceAnalysis
} from "@/lib/analysis/selected-place-analysis";
import { cn } from "@/lib/utils";

export function RightInfoPanel({ floating = false }: { floating?: boolean }) {
  const open = useUIStore((s) => s.rightPanelOpen);
  const setOpen = useUIStore((s) => s.setRightPanelOpen);
  const selectedId = useMapStore((s) => s.selectedParcelId);
  const selectedPoint = useMapStore((s) => s.selectedPoint);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setSelectedPoint = useMapStore((s) => s.setSelectedPoint);
  const flyTo = useMapStore((s) => s.flyTo);
  const watchlistAdd = useWatchlistStore((s) => s.add);
  const watchlistRemove = useWatchlistStore((s) => s.remove);
  const watchlistHas = useWatchlistStore((s) => s.has);
  const hydrateWatchlist = useWatchlistStore((s) => s.hydrateBackend);

  const parcelFeature = useParcel(selectedId);
  const parcel = parcelFeature?.properties ?? null;
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
  const [watchlistStatus, setWatchlistStatus] = React.useState<{
    state: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ state: "idle" });

  React.useEffect(() => {
    setReportStatus({ state: "idle" });
    setWatchlistStatus({ state: "idle" });
  }, [selectedId]);

  React.useEffect(() => {
    void hydrateWatchlist();
  }, [hydrateWatchlist]);

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
      setWatchlistStatus({ state: "success", message: "Yerel listeden çıkarıldı" });
    } else {
      setWatchlistStatus({ state: "loading", message: "Watchlist güncelleniyor…" });
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
          addLocal("Canlı watchlist'e eklendi");
        } catch (error) {
          addLocal(`${humanizeApiError(error)} Yerel yedek listeye eklendi.`, "error");
        }
      } else {
        addLocal("Canlı API parseli değil — yerel yedek listeye eklendi");
      }
    }
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
              "fixed right-0 top-14 bottom-0 z-30 flex flex-col",
              floating
                ? "w-[400px] xl:w-[400px] lg:w-[360px] border-l border-border-subtle bg-surface-2"
                : "w-[400px] border-l border-border-subtle bg-surface-2"
            )}
            aria-label="En yeni imar bölgeleri paneli"
          >
            <header className="flex flex-col gap-3 px-4 py-3 border-b border-border-subtle bg-surface-1/40">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-surface-2 text-[rgb(var(--accent-blue))]">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-fg-muted">Canlı plan akışı</div>
                      <div className="text-lg font-semibold text-fg-primary">En Yeni İmar Bölgeleri</div>
                    </div>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-fg-secondary">
                    {latestRegionsMessage ?? "Belediye plan veritabanından son kayıtlar. Geometrisi olmayan satırlar dürüstçe listede kalır, haritaya dökülmez."}
                  </p>
                </div>
                <IconButton label="Kapat" variant="ghost" onClick={deselect}>
                  <X className="h-4 w-4" />
                </IconButton>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md border border-border-subtle bg-surface-2/80 px-2 py-2">
                  <div className="text-[9px] uppercase tracking-wider text-fg-muted">Kayıt</div>
                  <div className="mt-1 text-sm font-semibold text-fg-primary tabular-nums">{latestRegionsTotal}</div>
                </div>
                <div className="rounded-md border border-border-subtle bg-surface-2/80 px-2 py-2">
                  <div className="text-[9px] uppercase tracking-wider text-fg-muted">Geometri</div>
                  <div className="mt-1 text-sm font-semibold text-fg-primary tabular-nums">{latestRegionsGeometryCount}</div>
                </div>
                <div className="rounded-md border border-border-subtle bg-surface-2/80 px-2 py-2">
                  <div className="text-[9px] uppercase tracking-wider text-fg-muted">Kaynak</div>
                  <div className="mt-1"><SourceBadge status={latestRegionsStatus === "idle" || latestRegionsStatus === "loading" ? "computed" : latestRegionsStatus} /></div>
                </div>
              </div>
            </header>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">
                {latestRegionsItems.length === 0 ? (
                  <div className="rounded-md border border-border-subtle bg-surface-1/50 px-3 py-3 text-sm text-fg-secondary">
                    {latestRegionsStatus === "loading" ? "Canlı kayıtlar yükleniyor…" : latestRegionsMessage ?? "Henüz gösterilecek imar bölgesi yok."}
                  </div>
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
                          "w-full rounded-lg border px-3 py-3 text-left transition-colors",
                          selected
                            ? "border-[rgb(var(--accent-blue))]/50 bg-[rgb(var(--accent-blue)/0.10)]"
                            : "border-border-subtle bg-surface-2 hover:bg-surface-1"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-fg-primary line-clamp-2">{item.label}</div>
                            <div className="mt-1 text-[11px] text-fg-secondary">
                              {[item.district, item.province].filter(Boolean).join(" / ") || item.municipality_name || "Konum bilgisi sınırlı"}
                            </div>
                          </div>
                          <SourceBadge status={item.has_geometry ? "live" : "unavailable"} label={item.has_geometry ? "geometri var" : "geometri yok"} className="shrink-0" />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-fg-muted">
                          {item.plan_type && <span>{item.plan_type}</span>}
                          {item.status && <span>• {item.status}</span>}
                          {item.aski_end && <span>• askı bitiş {formatDate(item.aski_end)}</span>}
                        </div>
                        {(item.pdf_url || item.gml_url) && (
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-fg-secondary">
                            {item.pdf_url && <span className="inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" /> PDF</span>}
                            {item.gml_url && <span className="inline-flex items-center gap-1"><MapPinned className="h-3 w-3" /> GML</span>}
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
            "fixed right-0 top-14 bottom-0 z-30 flex flex-col",
            floating
              ? "w-[400px] xl:w-[400px] lg:w-[360px] border-l border-border-subtle bg-surface-2"
              : "w-[400px] border-l border-border-subtle bg-surface-2"
          )}
          aria-label="Parsel detay paneli"
        >
          <header className="flex flex-col gap-3 px-4 py-3 border-b border-border-subtle bg-surface-1/40">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-[11px] uppercase tracking-wider text-fg-muted">
                  Ada/Parsel
                </span>
                <span className="text-xl font-semibold tabular-nums text-fg-primary">
                  {adaParselText(parcelData!.ada, parcelData!.parsel)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <IconButton
                  label={isWatchlisted ? "Watchlist'ten Çıkar" : "Watchlist'e Ekle"}
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
              <div className="flex items-center gap-2 min-w-0 text-xs text-fg-secondary">
                <span className="truncate">
                  {parcelData!.mahalle} · {parcelData!.ilce} / {parcelData!.il}
                </span>
                <SourceBadge status={parcelData!.sourceStatus ?? "demo"} />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ZoningBadge type={parcelData!.zoningType} size="xs" />
                <span className="text-[11px] tabular-nums text-fg-muted">
                  {formatArea(parcelData!.yuzolcumuM2)}
                </span>
              </div>
            </div>
            <ParcelWorkflowStrip
              parcel={parcelData!}
              hasGeometry={Boolean(backendGeometry) || Boolean(parcelData!.centroid)}
              geometrySource={backendGeometry ? "live" : parcelData!.centroid ? "demo" : "unavailable"}
              reportState={reportStatus.state}
            />
          </header>

          <section className="grid grid-cols-3 gap-2 px-3 py-2 border-b border-border-subtle bg-surface-1/20">
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

          <SectionParcelSummary parcel={parcelData!} />

          <ScrollArea className="flex-1">
            {!backendGeometry && parcelData!.backendId && (
              <div className="mx-3 mt-3 rounded-md border border-status-warning/40 bg-status-warning/10 px-3 py-2 text-[11px] text-status-warning">
                Geometri yok — haritada yaklaşık konum gösterilemiyor.
              </div>
            )}
            <Accordion
              type="multiple"
              defaultValue={["ai-analiz", "guven", "konum", "imar"]}
              className="divide-y divide-border-subtle"
            >
              {pointAnalysis && (
                <AccordionItem value="ai-analiz">
                  <AccordionTrigger>AI Nokta Analizi</AccordionTrigger>
                  <AccordionContent>
                    <SelectedPointAnalysisContent analysis={pointAnalysis} compact />
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
                    )} PDF Rapor
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <span className="inline-flex items-center gap-1">
                  {parcelData!.backendId ? "Canlı API ile rapor üret" : "Canlı API parseli olmadan resmi rapor üretilemez"}
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
              {isWatchlisted ? "Listeden Çıkar" : "Watchlist'e Ekle"}
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" /> Paylaş
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
            "fixed right-0 top-14 bottom-0 z-30 flex flex-col border-l border-white/10 bg-slate-950/86 shadow-[0_24px_80px_rgba(2,6,23,0.55)] backdrop-blur-2xl",
            floating ? "w-[400px] xl:w-[400px] lg:w-[360px]" : "w-[400px]"
          )}
          aria-label="Seçili nokta analizi paneli"
        >
          <header className="relative overflow-hidden border-b border-white/10 px-4 py-4">
            <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="absolute -left-12 top-10 h-32 w-32 rounded-full bg-cyan-300/10 blur-2xl" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200 shadow-[0_0_32px_rgba(56,189,248,0.28)]">
                    <WandSparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.24em] text-sky-200/70">Demo AI analiz</div>
                    <h2 className="text-lg font-semibold text-white">{analysis.title}</h2>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-300">{analysis.subtitle}</p>
              </div>
              <IconButton label="Kapat" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>
            <div className="relative mt-4 grid grid-cols-2 gap-2">
              <GlassMetric icon={<Crosshair className="h-3.5 w-3.5" />} label="Koordinat" value={analysis.coordinateLabel} />
              <GlassMetric icon={<Navigation className="h-3.5 w-3.5" />} label="Seçim" value={analysis.sourceLabel} />
            </div>
          </header>

          <ScrollArea className="flex-1">
            <SelectedPointAnalysisContent analysis={analysis} onSelectNearest={onSelectNearest} />
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function SelectedPointAnalysisContent({
  analysis,
  compact = false,
  onSelectNearest
}: {
  analysis: SelectedPlaceAnalysis;
  compact?: boolean;
  onSelectNearest?: () => void;
}) {
  return (
    <div className={cn("space-y-3", compact ? "p-0" : "p-3")}>
      <div className="rounded-xl border border-amber-300/20 bg-amber-300/8 px-3 py-2 text-[11px] leading-relaxed text-amber-100">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{analysis.disclaimer}</span>
        </div>
      </div>

      {analysis.nearestParcel && onSelectNearest && (
        <button
          type="button"
          onClick={onSelectNearest}
          className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-sky-300/20 bg-sky-300/10 px-3 py-3 text-left transition hover:border-sky-200/45 hover:bg-sky-300/15"
        >
          <span>
            <span className="block text-xs font-semibold text-sky-100">
              Yakın parseli seç: {adaParselText(analysis.nearestParcel.parcel.ada, analysis.nearestParcel.parcel.parsel)}
            </span>
            <span className="mt-1 block text-[11px] text-slate-300">
              {analysis.nearestParcel.distanceM.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} m · {analysis.nearestParcel.parcel.mahalle}
            </span>
          </span>
          <MapPinned className="h-4 w-4 text-sky-200 transition group-hover:scale-110" />
        </button>
      )}

      <div className="grid gap-2">
        {analysis.insights.map((card, index) => (
          <InsightCard key={card.id} card={card} index={index} />
        ))}
      </div>
    </div>
  );
}

function InsightCard({ card, index }: { card: PlaceInsightCard; index: number }) {
  return (
    <motion.article
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.035, 0.18) }}
      className={cn(
        "rounded-xl border bg-white/[0.045] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl",
        insightToneClass(card.tone)
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
            {insightIcon(card.kind)}
            <span>{card.title}</span>
          </div>
          <div className="mt-1 text-base font-semibold text-white">{card.value}</div>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">{card.detail}</p>
        </div>
        <SourceBadge status={card.provenance === "derived" ? "computed" : card.provenance} className="shrink-0" />
      </div>
      <ul className="mt-3 space-y-1.5 text-[11px] leading-relaxed text-slate-300">
        {card.bullets.slice(0, 3).map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-sky-200/80" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

function GlassMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2 backdrop-blur-xl">
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 truncate text-xs font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function insightToneClass(tone: PlaceInsightCard["tone"]) {
  switch (tone) {
    case "good":
      return "border-emerald-300/18 shadow-emerald-950/20";
    case "warning":
      return "border-amber-300/22 shadow-amber-950/20";
    case "danger":
      return "border-rose-300/24 shadow-rose-950/20";
    case "info":
      return "border-sky-300/18 shadow-sky-950/20";
    case "muted":
    default:
      return "border-white/10";
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
      return <Sparkles className="h-3.5 w-3.5" />;
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
    <article className="rounded-md border border-border-subtle bg-surface-2 px-2.5 py-2 min-w-0">
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
      <div className="rounded-md border border-border-subtle bg-surface-2">
        <TrustRow label="Parsel kaynağı" status={trustStatus(parcel.sourceStatus)} />
        <TrustRow label="Geometri" status={geometrySource} />
        <TrustRow label="İmar" status={imarSource} />
        <TrustRow label="Risk/Çevre" status="demo" labelOverride="Demo/Tahmini" />
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
  labelOverride
}: {
  label: string;
  status: "live" | "fallback" | "demo" | "unavailable";
  labelOverride?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b last:border-b-0 border-border-subtle px-3 py-2 text-xs">
      <span className="text-fg-secondary">{label}</span>
      <SourceBadge status={status} label={labelOverride} />
    </div>
  );
}

function trustStatus(status: DataSourceStatus | undefined) {
  return status === "live" || status === "fallback" || status === "unavailable" || status === "demo"
    ? status
    : "demo";
}
