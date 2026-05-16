"use client";

import * as React from "react";
import {
  Activity,
  ArrowRight,
  Database,
  ExternalLink,
  MapPin,
  Radar,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSourceHealth, useSources } from "@/lib/api/hooks";
import { getParcelSourceMetadata } from "@/data/parcel-source";
import { getCoveredCities, buildFlyTargetFromLocationTarget, type LocationExplorerTarget } from "@/data/location-navigation";
import { getSourceCoverage, type SourceCoverageState } from "@/lib/source-coverage";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import {
  buildProviderExplorerModel,
  readinessClassName
} from "@/lib/providers/provider-readiness";

export function DataCoverageBadge() {
  const metadata = React.useMemo(() => getParcelSourceMetadata(), []);
  const [open, setOpen] = React.useState(false);
  const [coverage, setCoverage] = React.useState<SourceCoverageState>({
    status: "unavailable",
    summary: null
  });
  const sourcesQuery = useSources();
  const healthQuery = useSourceHealth();
  const flyTo = useMapStore((s) => s.flyTo);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const selectedPoint = useMapStore((s) => s.selectedPoint);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const cityTargets = React.useMemo(() => getCoveredCities(), []);

  React.useEffect(() => {
    let mounted = true;
    getSourceCoverage().then((result) => {
      if (mounted) setCoverage(result);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const sources = React.useMemo(
    () => (sourcesQuery.data?.ok ? sourcesQuery.data.data.sources : []),
    [sourcesQuery.data]
  );
  const health = healthQuery.data?.ok ? healthQuery.data.data : null;
  const model = React.useMemo(
    () =>
      buildProviderExplorerModel({
        metadata,
        coverage,
        sources,
        health,
        cityTargets
      }),
    [cityTargets, coverage, health, metadata, sources]
  );

  const stateChip =
    metadata.mode === "unavailable"
      ? "unavailable"
      : metadata.fallbackReason || metadata.mode === "demo"
      ? "örnek veri"
      : metadata.endpoint
      ? "hazır"
      : "beklemede";

  function jumpToCity(target: LocationExplorerTarget) {
    setSelectedParcelId(null);
    setRightPanelOpen(false);
    flyTo(buildFlyTargetFromLocationTarget(target));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Sağlayıcı ve veri kapsamı"
          className={cn(
            "pointer-events-auto inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2/95 px-2.5 py-1.5 shadow-card backdrop-blur-sm",
            "text-[11px] text-fg-secondary transition-colors hover:bg-surface-3 hover:text-fg-primary",
            selectedPoint && "hidden 2xl:inline-flex"
          )}
        >
          <span
            className={cn(
              "inline-flex h-4 w-4 items-center justify-center rounded-full border",
              metadata.mode === "unavailable"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-700"
                : metadata.fallbackReason
                ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
                : "border-sky-500/30 bg-sky-500/10 text-sky-700"
            )}
          >
            <Database className="h-2.5 w-2.5" />
          </span>
          <span className="font-medium text-fg-primary">Parsel</span>
          <span className="rounded-full bg-surface-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-fg-muted">
            {stateChip}
          </span>
          <span className="tabular-nums text-fg-muted">
            {metadata.featureCount.toLocaleString("tr-TR")}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent
        size="xl"
        className={cn(
          "w-[calc(100vw-0.75rem)] max-w-none p-0 sm:w-[min(1080px,calc(100vw-1rem))]",
          "max-h-[calc(100dvh-0.75rem)] sm:max-h-[min(90vh,900px)] overflow-hidden"
        )}
      >
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="items-start gap-3 border-b border-border-subtle bg-surface-1/60 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.22em] text-fg-muted">
                Türkiye veri bağlantısı
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <DialogTitle className="text-base sm:text-lg">
                  Sağlayıcı gezgini
                </DialogTitle>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                    metadata.mode === "unavailable"
                      ? "border-rose-500/25 bg-rose-500/8 text-rose-700"
                      : metadata.fallbackReason
                      ? "border-amber-500/25 bg-amber-500/8 text-amber-700"
                      : "border-border-subtle bg-surface-1 text-fg-secondary"
                  )}
                >
                  {model.headerLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-1 px-2 py-0.5 text-[11px] text-fg-secondary">
                  <Activity className="h-3 w-3" />
                  {cityTargets.length.toLocaleString("tr-TR")} il
                </span>
              </div>
              <DialogDescription className="mt-1 max-w-3xl text-xs sm:text-sm">
                {metadata.unavailableReason
                  ? metadata.unavailableReason
                  : metadata.fallbackReason
                  ? metadata.fallbackReason
                  : metadata.mode === "demo"
                  ? "Parsel katmanı resmi olmayan örnek veriye düşüyor; sağlayıcı ve bağlayıcı hazırlığı yine de görünür tutuluyor."
                  : "Parsel katmanı canlı hedefe hazırlanıyor; bağlayıcı durumu ve kapsama özetleri burada toplanır."}
              </DialogDescription>
            </div>
            <DialogCloseButton className="shrink-0" />
          </DialogHeader>

          <ScrollArea className="min-h-0 flex-1">
            <div className="grid min-h-full gap-px bg-border-subtle lg:grid-cols-[1.05fr_0.95fr]">
              <section className="bg-surface-2 px-4 py-4 sm:px-5 sm:py-5">
                <PanelTitle
                  icon={<Radar className="h-4 w-4" />}
                  title="Parsel kaynağı ve canlılık durumu"
                  subtitle="İstenen mod ile aktif mod arasındaki fark"
                />

                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {model.metrics.map((metric) => (
                    <MetricCard key={metric.label} metric={metric} />
                  ))}
                </div>

                <div className="mt-4 grid gap-3">
                  <StateRow
                    label="Gerçek durum"
                    value={metadata.mode === "unavailable" ? "Production unavailable" : metadata.mode === "demo" ? "Örnek veri" : "Canlı hedef"}
                    detail={metadata.unavailableReason ?? metadata.fallbackReason ?? "Canlı veri henüz doğrulanmadı"}
                    icon={<AlertTriangle className="h-4 w-4" />}
                    tone={metadata.mode === "unavailable" ? "danger" : metadata.fallbackReason ? "warning" : metadata.mode === "demo" ? "info" : "success"}
                  />
                  <StateRow
                    label="Endpoint"
                    value={metadata.endpoint ? "var" : "yok"}
                    detail={metadata.endpoint ? metadata.endpoint : "Endpoint henüz bağlanmadı"}
                    icon={<Database className="h-4 w-4" />}
                    tone={metadata.endpoint ? "success" : "warning"}
                  />
                  <StateRow
                    label="Resmî veri"
                    value={metadata.official ? "evet" : "hayır"}
                    detail={metadata.official ? "Resmî akışa bağlı" : metadata.mode === "unavailable" ? "Production örnek veri fallback kapalı" : "Resmi olmayan örnek veri"}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    tone={metadata.official ? "success" : "muted"}
                  />
                </div>

                <div className="mt-5">
                  <PanelTitle
                    icon={<MapPin className="h-4 w-4" />}
                    title="Örnek kapsama şehirleri"
                    subtitle="Haritayı kapsama merkezlerine taşır"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cityTargets.length > 0 ? (
                      cityTargets.map((city) => (
                        <button
                          key={`${city.kind}:${city.label}`}
                          type="button"
                          onClick={() => jumpToCity(city)}
                          className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-3 py-1.5 text-left text-xs text-fg-secondary transition-colors hover:border-border-strong hover:bg-surface-3 hover:text-fg-primary"
                        >
                          <span className="font-medium text-fg-primary">{city.label}</span>
                          <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] tabular-nums text-fg-muted">
                            ~{city.count}
                          </span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-fg-secondary">Örnek kapsama şehri bulunamadı.</p>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <PanelTitle
                    icon={<Activity className="h-4 w-4" />}
                    title="Bootstrap özeti"
                    subtitle="Backend kaynak özeti varsa burada görünür"
                  />
                  {coverage.status === "ok" && coverage.summary ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      <StatCard
                        label="Toplam kaynak"
                        value={coverage.summary.totalSources}
                        detail={coverage.summary.lastGeneratedAt}
                      />
                      <StatCard label="Belediye" value={coverage.summary.municipalSources} detail="Yerel sağlayıcılar" />
                      <StatCard label="Ulusal" value={coverage.summary.nationalSources} detail="Ülke çapı kaynaklar" />
                      <StatCard label="Küresel" value={coverage.summary.globalSources} detail="Harici/uluslararası" />
                      <StatCard label="Public kaynak" value={coverage.summary.publicCandidateCount} detail="Açık kaynaklar" />
                      <StatCard label="Korumalı" value={coverage.summary.protectedCount} detail="Korumalı erişim kaynakları" />
                    </div>
                  ) : (
                    <div className="mt-3 rounded-lg border border-border-subtle bg-surface-1 px-3 py-2.5 text-sm text-fg-secondary">
                      {coverage.message ?? "Kaynak bootstrap özeti şu an alınamıyor."}
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-surface-2 px-4 py-4 sm:px-5 sm:py-5">
                <PanelTitle
                  icon={<Database className="h-4 w-4" />}
                  title="Sağlayıcı ve bağlayıcı hazırlığı"
                  subtitle="Kayıtlı kaynaklar, durum etiketleri ve uç nokta görünümü"
                />

                <div className="mt-4 space-y-3">
                  {model.rows.length > 0 ? (
                    model.rows.map((row) => <ReadinessRowCard key={row.id} row={row} />)
                  ) : (
                    <div className="rounded-lg border border-dashed border-border-subtle bg-surface-1 px-4 py-6 text-sm text-fg-secondary">
                      Sağlayıcı listesi henüz dolu değil.
                    </div>
                  )}
                </div>

                <div className="mt-5 rounded-lg border border-border-subtle bg-surface-1/60 p-3">
                  <div className="flex items-start gap-2">
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg-primary">Neler bekleniyor?</p>
                      <p className="mt-1 text-sm text-fg-secondary">
                        Public registry connector-ready deneyimi gösterir; parsel/imar sonucu yalnızca gerçek
                        endpoint ve provenance çözüldüğünde çizilir.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-border-subtle bg-surface-1/60 p-3">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg-primary">Sonraki adımlar</p>
                      <ul className="mt-2 space-y-1 text-sm text-fg-secondary">
                        {model.nextActions.slice(0, 5).map((action) => (
                          <li key={action} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fg-muted/70" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PanelTitle({
  icon,
  title,
  subtitle
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border-subtle bg-surface-1 text-fg-muted">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg-primary">{title}</p>
        <p className="text-xs text-fg-muted">{subtitle}</p>
      </div>
    </div>
  );
}

function MetricCard({
  metric
}: {
  metric: {
    label: string;
    value: string;
    detail?: string;
    tone: "success" | "warning" | "danger" | "muted" | "info";
  };
}) {
  return (
    <div className={cn("rounded-lg border px-3 py-2.5", readinessClassName(metric.tone))}>
      <p className="text-[11px] uppercase tracking-[0.16em] opacity-80">{metric.label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-sm font-semibold text-fg-primary">{metric.value}</p>
        {metric.detail && <span className="text-[11px] text-fg-muted">{metric.detail}</span>}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.16em] text-fg-muted">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-sm font-semibold tabular-nums text-fg-primary">
          {value.toLocaleString("tr-TR")}
        </p>
        <span className="text-[11px] text-fg-muted">{detail}</span>
      </div>
    </div>
  );
}

function StateRow({
  label,
  value,
  detail,
  icon,
  tone
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone: "success" | "warning" | "danger" | "muted" | "info";
}) {
  return (
    <div className={cn("rounded-lg border px-3 py-2.5", readinessClassName(tone))}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.16em] opacity-80">{label}</p>
          <p className="mt-0.5 text-sm font-semibold text-fg-primary">{value}</p>
          <p className="mt-0.5 text-sm text-fg-secondary">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function ReadinessRowCard({
  row
}: {
  row: {
    id: string;
    title: string;
    subtitle: string;
    label: string;
    tone: "success" | "warning" | "danger" | "muted" | "info";
    endpoint?: string;
    endpointLabel: string;
    detail: string;
    notes: string[];
  };
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 p-3 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg-primary">{row.title}</p>
          <p className="mt-0.5 text-xs text-fg-muted">{row.subtitle}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
            readinessClassName(row.tone)
          )}
        >
          {row.label}
        </span>
      </div>
      <div className="mt-3 grid gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-2 text-fg-secondary">
          <span className="rounded-full border border-border-subtle bg-surface-2 px-2 py-0.5 text-[11px]">
            {row.endpointLabel}
          </span>
          {row.endpoint && (
            <span className="break-all text-[11px] text-fg-muted">{row.endpoint}</span>
          )}
        </div>
        <p className="text-sm text-fg-secondary">{row.detail}</p>
        {row.notes.length > 0 && (
          <ul className="space-y-1 text-sm text-fg-secondary">
            {row.notes.map((note) => (
              <li key={note} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fg-muted/70" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
