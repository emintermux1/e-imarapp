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
import { adaParselText, formatArea } from "@/lib/format";
import { SectionKonum } from "@/components/info/section-konum";
import { SectionImar } from "@/components/info/section-imar";
import { SectionPlanNotlari } from "@/components/info/section-plan-notlari";
import { SectionRiskler } from "@/components/info/section-riskler";
import { SectionAski } from "@/components/info/section-aski";
import { SectionCevre } from "@/components/info/section-cevre";
import { SectionGecmis } from "@/components/info/section-gecmis";
import { SectionYatirimSkoru } from "@/components/info/section-yatirim-skoru";
import { EmsalCalculatorPanel } from "@/components/emsal/emsal-calculator-panel";
import { cn } from "@/lib/utils";

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

  const [emsalOpen, setEmsalOpen] = React.useState(false);
  const [vh, setVh] = React.useState<number>(800);

  React.useEffect(() => {
    const apply = () => setVh(window.innerHeight);
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

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
        centroid: parcel.centroid ?? [0, 0]
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
        "lg:hidden fixed left-0 right-0 bottom-0 z-30 bg-surface-2 border-t border-border-strong",
        "rounded-t-md shadow-sheet flex flex-col"
      )}
    >
      <button
        type="button"
        aria-label="Sürükle"
        className="self-stretch py-2 cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <span className="block mx-auto h-1 w-10 rounded-full bg-border-strong" />
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
              <SectionGecmis />
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
      <footer className="grid grid-cols-3 gap-2 px-3 py-2 border-t border-border-subtle bg-surface-1/40">
        <Button variant="primary" size="sm" onClick={() => setEmsalOpen(true)}>
          <Calculator className="h-3.5 w-3.5" /> Emsal
        </Button>
        <Button variant="secondary" size="sm" onClick={toggleWatchlist}>
          <Star className={cn("h-3.5 w-3.5", isWatchlisted && "fill-[rgb(var(--accent-red))] text-[rgb(var(--accent-red))]")} />
          {isWatchlisted ? "Listede" : "Takip Et"}
        </Button>
        <Button variant="ghost" size="sm">
          <Share2 className="h-3.5 w-3.5" /> Paylaş
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
