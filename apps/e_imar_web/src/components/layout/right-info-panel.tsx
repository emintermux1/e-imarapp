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
  Route
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
import { adaParselText, formatArea } from "@/lib/format";
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

  if (!parcel) return null;

  function close() {
    setOpen(false);
    // optionally also clear selection
  }

  function deselect() {
    setOpen(false);
    setSelectedParcelId(null);
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
                  {adaParselText(parcel.ada, parcel.parsel)}
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
                  {parcel.mahalle} · {parcel.ilce} / {parcel.il}
                </span>
                <SourceBadge status={parcel.sourceStatus ?? "demo"} />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ZoningBadge type={parcel.zoningType} size="xs" />
                <span className="text-[11px] tabular-nums text-fg-muted">
                  {formatArea(parcel.yuzolcumuM2)}
                </span>
              </div>
            </div>
            <ParcelWorkflowStrip
              parcel={parcel}
              hasGeometry={Boolean(backendGeometry) || Boolean(parcel.centroid)}
              geometrySource={backendGeometry ? "live" : parcel.centroid ? "demo" : "unavailable"}
              reportState={reportStatus.state}
            />
          </header>

          <section className="grid grid-cols-3 gap-2 px-3 py-2 border-b border-border-subtle bg-surface-1/20">
            <MetricCard
              icon={<Building2 className="h-3.5 w-3.5" />}
              label="Yapı Potansiyeli"
              value={`${Math.round(parcel.yuzolcumuM2 * parcel.kaks).toLocaleString("tr-TR")} m²`}
              hint={`KAKS ${parcel.kaks.toFixed(2)} · TAKS ${parcel.taks.toFixed(2)}`}
            />
            <MetricCard
              icon={<ShieldAlert className="h-3.5 w-3.5" />}
              label="Risk Bileşimi"
              value={`D${parcel.riskler.deprem} · S${parcel.riskler.sel}`}
              hint={`Heyelan ${parcel.riskler.heyelan} · Yangın ${parcel.riskler.yangin}`}
            />
            <MetricCard
              icon={<Route className="h-3.5 w-3.5" />}
              label="Erişilebilirlik"
              value={`${Math.round(parcel.cevre.ulasimSkoru)}/100`}
              hint={`Metro ${Math.round(parcel.cevre.metroM)} m · Park ${Math.round(parcel.cevre.parkM)} m`}
            />
          </section>

          <SectionParcelSummary parcel={parcel} />

          <ScrollArea className="flex-1">
            {!backendGeometry && parcel.backendId && (
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
                    parcel={parcel}
                    geometrySource={backendGeometry ? "live" : parcel.centroid ? "demo" : "unavailable"}
                    imarSource={parcel.backendId && backendResponse ? "fallback" : trustStatus(parcel.sourceStatus)}
                    askiStatus={askiStatus}
                    liveAskiCount={askiPlans.length}
                    lastCheckedAt={askiLastCheckedAt}
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
                  {parcel.backendId ? "Canlı API ile rapor üret" : "Canlı API parseli olmadan resmi rapor üretilemez"}
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
            parcel={parcel}
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
