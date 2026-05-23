"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Eye, ChevronDown, Box, Clock, MousePointer2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { useMapStore } from "@/stores/map-store";
import { useParcel } from "@/hooks/use-parcel";
import { cn } from "@/lib/utils";

const MONTH_LABELS = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"
];

// Quick sun presets for common analysis times
const SUN_PRESETS = [
  { label: "Sabah", hour: 8, icon: "🌅" },
  { label: "Öğle", hour: 12, icon: "☀️" },
  { label: "Akşam", hour: 17, icon: "🌇" }
];

/**
 * 3D-only floating panel that appears next to the right info panel when the
 * map is in 3D mode. Drives shadow analysis and view corridor.
 *
 * Sits left of the 3D HUD controls and right info panel so it never blocks
 * mode switching, compass, or zoom actions.
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

  const visible = mapMode === "3d";

  const isNight = sunHour < 6 || sunHour > 19;

  const hudClearance = 168;
  const rightOffset = (rightPanelOpen ? 420 : 16) + hudClearance;

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
            "fixed top-[9.75rem] z-30 hidden max-h-[calc(100dvh-11rem)] w-[286px] flex-col overflow-hidden lg:flex 2xl:top-24",
            "rounded-[1.45rem] border border-white/55 bg-surface-2/96 shadow-[0_1px_0_rgb(255_255_255/0.72)_inset,0_22px_54px_-34px_rgb(var(--accent-navy)/0.46)] backdrop-blur-sm"
          )}
          style={{ right: rightOffset }}
          aria-label="3D analiz paneli"
        >
          <header className="flex items-center justify-between gap-2 border-b border-border-subtle/80 bg-surface-1/72 px-3 py-2.5">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-blue">
                <Box className="h-3.5 w-3.5" />
                3D Analiz
              </span>
              <p className="mt-0.5 truncate text-[11px] text-fg-muted">
                Kütle, gölge, emsal ve görüş
              </p>
            </div>
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
            <div className="flex flex-col gap-3 overflow-y-auto px-3 pb-3 pt-3">
              {!parcel && (
                <div className="flex items-start gap-2 rounded-xl border border-brand-blue/25 bg-[rgb(var(--accent-blue)/0.08)] px-3 py-2 text-[11px] leading-relaxed text-fg-secondary">
                  <MousePointer2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--accent-blue))]" />
                  <span>Haritada bir parsel seçince emsal envelope ve görüş koridoru doğrudan seçili parsele bağlanır.</span>
                </div>
              )}
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
                <div className="flex gap-1.5">
                  {SUN_PRESETS.map((preset) => (
                    <Button
                      key={preset.hour}
                      variant={sunHour === preset.hour ? "primary" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSunHour(preset.hour);
                        if (!shadowEnabled) setShadowEnabled(true);
                      }}
                      className="flex-1 text-[10px] px-2 py-1.5 h-auto"
                    >
                      <span className="mr-1">{preset.icon}</span>
                      {preset.label}
                    </Button>
                  ))}
                </div>

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
                  <p className="text-[10px] text-fg-muted leading-snug">
                    💡 Gölge analizini etkinleştirerek gerçek zamanlı gölgeleme görebilirsiniz.
                  </p>
                )}
              </Section>

              <div className="border-t border-border-subtle pt-2">
                <SwitchRow
                  icon={<Box className="h-3.5 w-3.5 text-fg-muted" />}
                  label="Emsal Envelope"
                  hint={parcel ? "Seçili parselin maksimum inşaat potansiyeli" : "Parsel seçimi bekleniyor"}
                  checked={emsalWireframe}
                  onCheckedChange={setEmsalWireframe}
                  disabled={!parcel}
                />
                <SwitchRow
                  icon={<Eye className="h-3.5 w-3.5 text-fg-muted" />}
                  label="Görüş Koridoru"
                  hint={parcel ? "Komşu yapı engellerini görselleştirir" : "Parsel seçimi bekleniyor"}
                  checked={viewCorridor}
                  onCheckedChange={setViewCorridor}
                  disabled={!parcel}
                />
              </div>
              {parcel && (
                <div className="border-t border-border-subtle pt-2">
                  <div className="text-[10px] uppercase tracking-wider text-fg-muted font-medium mb-2">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Seçili Parsel
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <Stat label="Ada / Parsel" value={`${parcel.ada}/${parcel.parsel}`} />
                    <Stat label="Maks. Kat" value={`${parcel.katSiniri}`} />
                    <Stat label="Gabari" value={`${parcel.gabariM.toFixed(0)} m`} />
                    <Stat
                      label="Max Yapı Alanı"
                      value={`${Math.round(parcel.yuzolcumuM2 * parcel.kaks).toLocaleString("tr-TR")} m²`}
                    />
                  </div>
                </div>
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
      <div className="uppercase tracking-wider text-fg-muted text-[9px]">{label}</div>
      <div className="mt-0.5 text-fg-primary font-medium tabular-nums text-xs">{value}</div>
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
      <div className="flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}

function SwitchRow({
  icon,
  label,
  hint,
  checked,
  onCheckedChange,
  disabled = false
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex items-center justify-between gap-3 py-1.5", disabled && "opacity-55")}>
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
        disabled={disabled}
      />
    </label>
  );
}
