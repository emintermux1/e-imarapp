"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Share2,
  Star,
  Calculator,
  FileDown,
  Loader2
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
import { generateBackendReport } from "@/lib/api/backend-client";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";
import { useParcel } from "@/hooks/use-parcel";
import { useWatchlistStore } from "@/stores/watchlist-store";
import { adaParselText, formatArea } from "@/lib/format";
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
import { cn } from "@/lib/utils";

export function RightInfoPanel({ floating = false }: { floating?: boolean }) {
  const open = useUIStore((s) => s.rightPanelOpen);
  const setOpen = useUIStore((s) => s.setRightPanelOpen);
  const selectedId = useMapStore((s) => s.selectedParcelId);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const watchlistAdd = useWatchlistStore((s) => s.add);
  const watchlistRemove = useWatchlistStore((s) => s.remove);
  const watchlistHas = useWatchlistStore((s) => s.has);

  const parcelFeature = useParcel(selectedId);
  const parcel = parcelFeature?.properties ?? null;
  const isWatchlisted = parcel ? watchlistHas(parcel.id) : false;

  const [emsalOpen, setEmsalOpen] = React.useState(false);
  const [reportStatus, setReportStatus] = React.useState<{
    state: "idle" | "loading" | "success" | "error";
    message?: string;
    url?: string;
  }>({ state: "idle" });

  if (!parcel) return null;

  function close() {
    setOpen(false);
    // optionally also clear selection
  }

  function deselect() {
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
        centroid: parcel.centroid ?? [0, 0]
      });
    }
  }

  async function generateReport() {
    if (!parcel) return;
    if (!parcel.backendId) {
      setReportStatus({
        state: "error",
        message: "PDF rapor için canlı API parseli gerekir"
      });
      return;
    }
    setReportStatus({ state: "loading", message: "PDF rapor hazırlanıyor…" });
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
        state: "success",
        message: report.pdf_url ? "PDF rapor hazır; bağlantı açıldı" : `Rapor isteği alındı · durum: ${report.status}`,
        url: report.pdf_url
      });
    } catch {
      setReportStatus({
        state: "error",
        message: "PDF rapor servisine ulaşılamıyor"
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
          </header>

          <ScrollArea className="flex-1">
            <Accordion
              type="multiple"
              defaultValue={["konum", "imar"]}
              className="divide-y divide-border-subtle"
            >
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
                    disabled={reportStatus.state === "loading"}
                    className="w-full"
                  >
                    {reportStatus.state === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )} PDF Rapor
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <span className="inline-flex items-center gap-1">
                  {parcel.backendId ? "Canlı API ile rapor üret" : "PDF rapor için canlı API parseli gerekir"}
                </span>
              </TooltipContent>
            </Tooltip>
            {reportStatus.message && (
              <div
                className={cn(
                  "col-span-2 rounded-md border px-2.5 py-1.5 text-[11px]",
                  reportStatus.state === "success"
                    ? "border-status-success/40 bg-status-success/10 text-status-success"
                    : reportStatus.state === "error"
                    ? "border-status-warning/40 bg-status-warning/10 text-status-warning"
                    : "border-border-subtle bg-surface-2 text-fg-muted"
                )}
              >
                {reportStatus.url ? (
                  <a href={reportStatus.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    {reportStatus.message}
                  </a>
                ) : (
                  reportStatus.message
                )}
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleWatchlist}
              className="col-span-1"
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  isWatchlisted &&
                    "fill-[rgb(var(--accent-red))] text-[rgb(var(--accent-red))]"
                )}
              />
              {isWatchlisted ? "Listeden Çıkar" : "Watchlist'e Ekle"}
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" /> Paylaş
            </Button>
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
