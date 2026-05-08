"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Eye, ChevronDown, Box } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useUIStore } from "@/stores/ui-store";
import { useMapStore } from "@/stores/map-store";
import { useParcel } from "@/hooks/use-parcel";
import { cn } from "@/lib/utils";

const MONTH_LABELS = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"
];

const SCENARIOS = {
  mevcut: { label: "Mevcut", sunHour: 12, sunMonth: 6, katsayi: 1 },
  kisSabah: { label: "Kış Sabah", sunHour: 9, sunMonth: 1, katsayi: 1.08 },
  yazAksam: { label: "Yaz Akşam", sunHour: 18, sunMonth: 8, katsayi: 1.15 }
} as const;

/**
 * 3D-only floating panel that appears next to the right info panel when the
 * map is in 3D mode. Drives shadow analysis and view corridor.
 *
 * Sits at top:14 right:16+panelWidth so it never overlaps the info panel
 * when both are open.
 */
export function Section3DAnalizleri() {
  const mapMode = useUIStore((s) => s.mapMode);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const shadowEnabled = useUIStore((s) => s.shadowEnabled);
  const setShadowEnabled = useUIStore((s) => s.setShadowEnabled);
  const sunHour = useUIStore((s) => s.sunHour);
  const setSunHour = useUIStore((s) => s.setSunHour);
  const sunMonth = useUIStore((s) => s.sunMonth);
  const setSunMonth = useUIStore((s) => s.setSunMonth);
  const emsalWireframe = useUIStore((s) => s.emsalWireframe);
  const setEmsalWireframe = useUIStore((s) => s.setEmsalWireframe);
  const viewCorridor = useUIStore((s) => s.viewCorridor);
  const setViewCorridor = useUIStore((s) => s.setViewCorridor);
  const selectedParcelId = useMapStore((s) => s.selectedParcelId);
  const parcelFeature = useParcel(selectedParcelId);
  const parcel = parcelFeature?.properties;

  const [collapsed, setCollapsed] = React.useState(false);
  const [activeScenario, setActiveScenario] = React.useState<keyof typeof SCENARIOS>("mevcut");

  const visible = mapMode === "3d";

  const isNight = sunHour < 6 || sunHour > 19;

  // Position: right edge offset accounts for the (open) right info panel.
  const rightOffset = rightPanelOpen ? 416 : 16;

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          key="3d-analizleri"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "fixed top-[72px] z-30 hidden lg:flex flex-col gap-2 w-[280px]",
            "rounded-md border border-border-strong bg-surface-2 shadow-pop"
          )}
          style={{ right: rightOffset }}
          aria-label="3D analiz paneli"
        >
          <header className="flex items-center justify-between gap-2 px-3 h-9 border-b border-border-subtle">
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-fg-secondary">
              <Box className="h-3.5 w-3.5 text-fg-muted" />
              3D Analizleri
            </span>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Paneli aç" : "Paneli daralt"}
              className="h-6 w-6 inline-flex items-center justify-center rounded text-fg-muted hover:bg-surface-1 hover:text-fg-primary"
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  collapsed ? "-rotate-90" : "rotate-0"
                )}
              />
            </button>
          </header>

          {!collapsed && (
            <div className="flex flex-col gap-3 px-3 pb-3 pt-1">
              <Section
                icon={
                  isNight ? (
                    <Moon className="h-3.5 w-3.5 text-fg-muted" />
                  ) : (
                    <Sun className="h-3.5 w-3.5 text-fg-muted" />
                  )
                }
                label="Güneş & Gölge"
                control={
                  <Switch
                    checked={shadowEnabled}
                    onCheckedChange={setShadowEnabled}
                    aria-label="Gölge analizini göster"
                  />
                }
              >
                <div className="flex items-center gap-3 text-[11px] tabular-nums text-fg-secondary">
                  <span className="text-fg-muted uppercase tracking-wider text-[10px]">
                    Saat
                  </span>
                  <Slider
                    value={[sunHour]}
                    min={0}
                    max={23}
                    step={1}
                    onValueChange={([v]) => setSunHour(v)}
                    className="flex-1"
                    aria-label="Saat seçici"
                  />
                  <span className="font-semibold text-fg-primary w-8 text-right">
                    {String(sunHour).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] tabular-nums text-fg-secondary">
                  <span className="text-fg-muted uppercase tracking-wider text-[10px]">
                    Ay
                  </span>
                  <Slider
                    value={[sunMonth]}
                    min={1}
                    max={12}
                    step={1}
                    onValueChange={([v]) => setSunMonth(v)}
                    className="flex-1"
                    aria-label="Ay seçici"
                  />
                  <span className="font-semibold text-fg-primary w-8 text-right">
                    {MONTH_LABELS[sunMonth - 1]}
                  </span>
                </div>
                {!shadowEnabled && (
                  <p className="text-[10px] text-fg-muted">
                    Anahtarı açın: gerçek zamanlı gölgeleme açılır.
                  </p>
                )}
              </Section>

              <div className="border-t border-border-subtle pt-2">
                <SwitchRow
                  icon={<Box className="h-3.5 w-3.5 text-fg-muted" />}
                  label="Emsal Envelope"
                  hint="TAKS × kat × 3 m wireframe"
                  checked={emsalWireframe}
                  onCheckedChange={setEmsalWireframe}
                />
                <SwitchRow
                  icon={<Eye className="h-3.5 w-3.5 text-fg-muted" />}
                  label="Görüş Koridoru"
                  hint="Komşu yapı engellerini görselleştirir"
                  checked={viewCorridor}
                  onCheckedChange={setViewCorridor}
                />
              </div>
              {parcel && (
                <>
                  <div className="border-t border-border-subtle pt-2">
                    <div className="text-[10px] uppercase tracking-wider text-fg-muted mb-1.5">
                      Senaryo Karşılaştırma
                    </div>
                    <div className="flex gap-1">
                      {(Object.keys(SCENARIOS) as Array<keyof typeof SCENARIOS>).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setActiveScenario(key);
                            setSunHour(SCENARIOS[key].sunHour);
                            setSunMonth(SCENARIOS[key].sunMonth);
                          }}
                          className={cn(
                            "h-6 px-2 rounded-sm border text-[10px] uppercase tracking-wider",
                            activeScenario === key
                              ? "border-border-strong bg-surface-1 text-fg-primary"
                              : "border-border-subtle text-fg-muted hover:text-fg-primary"
                          )}
                        >
                          {SCENARIOS[key].label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-border-subtle pt-2 grid grid-cols-2 gap-2 text-[10px]">
                    <Stat label="Seçili parsel" value={`${parcel.ada}/${parcel.parsel}`} />
                    <Stat label="Maks. kat" value={`${parcel.katSiniri} kat`} />
                    <Stat label="Gabari" value={`${parcel.gabariM.toFixed(1)} m`} />
                    <Stat
                      label="3D envelope"
                      value={`${Math.round(parcel.yuzolcumuM2 * parcel.kaks).toLocaleString("tr-TR")} m²`}
                    />
                    <Stat
                      label="Senaryo inşaat"
                      value={`${Math.round(parcel.yuzolcumuM2 * parcel.kaks * SCENARIOS[activeScenario].katsayi).toLocaleString("tr-TR")} m²`}
                    />
                    <Stat
                      label="Güneş profili"
                      value={`${String(sunHour).padStart(2, "0")}:00 · ${MONTH_LABELS[sunMonth - 1]}`}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border-subtle bg-surface-1/60 px-2 py-1.5">
      <div className="uppercase tracking-wider text-fg-muted">{label}</div>
      <div className="mt-0.5 text-fg-primary font-medium tabular-nums">{value}</div>
    </div>
  );
}

function Section({
  icon,
  label,
  control,
  children
}: {
  icon: React.ReactNode;
  label: string;
  control?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-fg-primary">
          {icon}
          {label}
        </span>
        {control}
      </div>
      {children}
    </div>
  );
}

function SwitchRow({
  icon,
  label,
  hint,
  checked,
  onCheckedChange
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5">
      <span className="flex items-center gap-2 min-w-0">
        {icon}
        <span className="flex flex-col">
          <span className="text-[11px] font-medium text-fg-primary">
            {label}
          </span>
          {hint && (
            <span className="text-[10px] text-fg-muted leading-tight">
              {hint}
            </span>
          )}
        </span>
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </label>
  );
}
