"use client";

import * as React from "react";
import { Orbit, Radar, ThermometerSun, Waves, ShieldAlert } from "lucide-react";
import { SatelliteCompareSlider } from "@/components/gis/satellite-compare-slider";
import type { ParcelProps } from "@/types/parcel";
import { cn } from "@/lib/utils";

interface SectionSatelliteIntelligenceProps {
  parcel: ParcelProps;
}

interface SignalMetric {
  key: string;
  label: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  icon: React.ReactNode;
  note: string;
}

function seeded(parcelId: string, salt: string) {
  const key = `${parcelId}:${salt}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function ratio(parcelId: string, salt: string, min: number, max: number) {
  const n = seeded(parcelId, salt) % 1000;
  return min + ((max - min) * n) / 1000;
}

function metrics(parcel: ParcelProps): SignalMetric[] {
  const urbanHeat = ratio(parcel.id, "heat", 0.6, 4.8);
  const greenDelta = ratio(parcel.id, "green", -18, 12);
  const impermeable = ratio(parcel.id, "impermeable", 24, 92);
  const floodSignal = ratio(parcel.id, "flood", 8, 88);
  const constructionPressure = ratio(parcel.id, "construction", 15, 95);

  return [
    {
      key: "heat",
      label: "Isı Adası Anomalisi",
      value: +urbanHeat.toFixed(1),
      unit: "°C",
      trend: urbanHeat >= 2.3 ? "up" : urbanHeat <= 1.2 ? "stable" : "up",
      icon: <ThermometerSun className="h-4 w-4" />,
      note: "Sentinel-L2 termal türev sinyali ile normalize edilmiş sıcaklık farkı."
    },
    {
      key: "green",
      label: "Yeşil Örtü Değişimi",
      value: +greenDelta.toFixed(1),
      unit: "%",
      trend: greenDelta >= 1 ? "up" : greenDelta <= -2 ? "down" : "stable",
      icon: <Radar className="h-4 w-4" />,
      note: "Çok zamanlı NDVI benzeri indeks farkı."
    },
    {
      key: "impermeable",
      label: "Geçirimsiz Yüzey Oranı",
      value: +impermeable.toFixed(0),
      unit: "%",
      trend: impermeable > 70 ? "up" : "stable",
      icon: <Orbit className="h-4 w-4" />,
      note: "Yapılaşma/sert zemin segmentasyon tahmini."
    },
    {
      key: "flood",
      label: "Yüzey Su Baskın Sinyali",
      value: +floodSignal.toFixed(0),
      unit: "/100",
      trend: floodSignal >= 60 ? "up" : floodSignal <= 35 ? "stable" : "up",
      icon: <Waves className="h-4 w-4" />,
      note: "Yağış sonrası spektral yansıma anomalisi."
    },
    {
      key: "construction",
      label: "İnşaat Aktivite Baskısı",
      value: +constructionPressure.toFixed(0),
      unit: "/100",
      trend: constructionPressure > 65 ? "up" : constructionPressure < 35 ? "down" : "stable",
      icon: <ShieldAlert className="h-4 w-4" />,
      note: "Zamansal doku/frekans temelli değişim yoğunluğu."
    }
  ];
}

function trendLabel(trend: SignalMetric["trend"]) {
  if (trend === "up") return "Yükseliş";
  if (trend === "down") return "Azalış";
  return "Stabil";
}

export function SectionSatelliteIntelligence({
  parcel
}: SectionSatelliteIntelligenceProps) {
  const data = React.useMemo(() => metrics(parcel), [parcel]);
  const highRiskCount = data.filter(
    (item) =>
      (item.key === "heat" && item.value >= 2.5) ||
      (item.key === "impermeable" && item.value >= 75) ||
      (item.key === "flood" && item.value >= 65)
  ).length;

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border-subtle bg-surface-1/60 p-2.5">
        <p className="text-[11px] text-fg-secondary leading-relaxed">
          Çok zamanlı uydu analiz özeti (demo/simülasyon): parsel çevresindeki
          spektral değişim, geçirimsiz yüzey ve ısı adası sinyallerini
          birleştirir. Bu panel karar desteği içindir, resmi ölçüm değildir.
        </p>
      </div>

      <div className="grid gap-2">
        {data.map((item) => (
          <article
            key={item.key}
            className="rounded-md border border-border-subtle bg-surface-2 px-2.5 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-xs text-fg-primary">
                <span className="text-fg-muted">{item.icon}</span>
                {item.label}
              </div>
              <div className="text-xs tabular-nums font-semibold text-fg-primary">
                {item.value}
                {item.unit}
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wider",
                  item.trend === "up"
                    ? "text-status-warning"
                    : item.trend === "down"
                      ? "text-status-success"
                      : "text-fg-muted"
                )}
              >
                {trendLabel(item.trend)}
              </span>
              <span className="text-[10px] text-fg-muted truncate">
                {item.note}
              </span>
            </div>
          </article>
        ))}
      </div>

      <SatelliteCompareSlider />

      <div className="rounded-md border border-border-subtle bg-surface-1/60 px-2.5 py-2 text-[11px] text-fg-secondary">
        <span className="font-medium text-fg-primary">
          Otomatik Yorum:
        </span>{" "}
        {highRiskCount >= 3
          ? "Parsel çevresinde yüksek baskı sinyali var; imar kararlarında taşkın ve ısı adası etkisini önceliklendirin."
          : "Uydu sinyalleri orta/denge seviyede; plan notları ve sahadaki resmi kurum verisiyle birlikte değerlendirin."}
      </div>
    </div>
  );
}
