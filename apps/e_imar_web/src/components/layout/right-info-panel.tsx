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
  Sparkles
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
import { cn } from "@/lib/utils";
import { getParcelMarket } from "@/lib/market-client";
import type { ParcelMarketResponse } from "@/types/api";
import { MarketPanel } from "@/components/market/market-panel";

export function RightInfoPanel({ floating = false }: { floating?: boolean }) {
  const open = useUIStore((s) => s.rightPanelOpen);
  const setOpen = useUIStore((s) => s.setRightPanelOpen);
  const selectedId = useMapStore((s) => s.selectedParcelId);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
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
  const [marketResponse, setMarketResponse] = React.useState<ParcelMarketResponse | null>(null);
  const [marketLoading, setMarketLoading] = React.useState(false);
  const [watchlistStatus, setWatchlistStatus] = React.useState<{
    state: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ state: "idle" });

  React.useEffect(() => {
    setReportStatus({ state: "idle" });
    setWatchlistStatus({ state: "idle" });
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

  const showLatestRegions = !parcel && latestRegionsPanelOpen;

  if (!parcel && !showLatestRegions) return null;

  const parcelData = parcel ?? undefined;

  function close() {
    setOpen(false);
    // optionally also clear selection
  }

  function deselect() {
    setOpen(false);
    setSelectedParcelId(null);
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
              defaultValue={["guven", "konum", "imar"]}
              className="divide-y divide-border-subtle"
            >
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
