"use client";

import * as React from "react";
import { AlertCircle, Building2, ChevronDown, ExternalLink, Layers3, Search, ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CommandEmpty, CommandGroup, CommandItem, CommandList, CommandRoot } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { BELEDIYE_LIST } from "@/data/belediye";
import { PROVINCES } from "@/data/provinces";
import { DISTRICTS } from "@/data/districts";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { useMunicipalityStore } from "@/stores/municipality-store";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";
import { useBackendParcelStore } from "@/stores/backend-parcel-store";
import { useSourceStore } from "@/stores/source-store";
import { municipalParcelId } from "@/lib/api/parcel-normalizer";
import { fetchMunicipalParcelWorkflow, fetchMunicipalityCoverage, fetchOgcCatalog } from "@/lib/api/eimar";
import type { MunicipalParcelWorkflowResponse, MunicipalityCoverageEntry, OgcLayerCatalogResponse, OgcLayerCatalogEntry } from "@/lib/api/types";
import {
  filterMunicipalityCoverage,
  formatWorkflowProvenance,
  normalizeOgcLayer,
  sanitizeEndpointUrl,
  buildWmsTileUrl
} from "@/lib/workflow-helpers";
import { Kbd } from "@/components/ui/kbd";

interface ParcelQueryState {
  province: string;
  district: string;
  municipalityId: string;
  mahalle: string;
  ada: string;
  parsel: string;
}

const FALLBACK_MUNICIPALITIES = BELEDIYE_LIST.slice(0, 10).map((record) => ({
  id: record.id,
  name: record.ad,
  province: PROVINCES.find((province) => province.slug === record.ilSlug)?.name ?? record.ilSlug,
  district: "",
  municipalitySlug: record.id,
  homepageUrl: "",
  accessStatus: "unknown",
  capabilities: ["zoning_status", "municipal_gis"],
  connectorKinds: ["municipal_portal"],
  capability: {
    source: null,
    registered: true,
    publicCandidate: false,
    protected: false,
    lastHealth: null,
    imarQuerySupport: "unknown",
    parcelGeometrySupport: "unknown",
    reasonNoData: "Kaynak public registry önbelleğinde",
    nextAction: "Backend bağlantısı geldiğinde public coverage yenilenir."
  }
}));

export function MunicipalityWorkbench() {
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const flyTo = useMapStore((s) => s.flyTo);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const upsertOverlayFromSearch = useBackendParcelStore((s) => s.upsertOverlayFromSearch);
  const activateCatalogWmsLayer = useSourceStore((s) => s.activateCatalogWmsLayer);
  const deactivateLiveLayer = useSourceStore((s) => s.deactivateLiveLayer);
  const selectedMunicipalityId = useMunicipalityStore((s) => s.selectedMunicipalityId);
  const setSelectedMunicipality = useMunicipalityStore((s) => s.setSelectedMunicipality);
  const clearSelectedMunicipality = useMunicipalityStore((s) => s.clearSelectedMunicipality);

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [workflow, setWorkflow] = React.useState<{
    loading: boolean;
    result: MunicipalParcelWorkflowResponse | null;
    error: string | null;
  }>({ loading: false, result: null, error: null });
  const [parcelQuery, setParcelQuery] = React.useState<ParcelQueryState>({
    province: "",
    district: "",
    municipalityId: "",
    mahalle: "",
    ada: "",
    parsel: ""
  });
  const [catalog, setCatalog] = React.useState<{
    loading: boolean;
    result: OgcLayerCatalogResponse | null;
    error: string | null;
  }>({ loading: false, result: null, error: null });
  const [activeLayers, setActiveLayers] = React.useState<string[]>([]);

  const coverageQuery = useQuery({
    queryKey: ["municipality-coverage", parcelQuery.province, parcelQuery.district],
    queryFn: () => fetchMunicipalityCoverage({ province: parcelQuery.province, district: parcelQuery.district }),
    staleTime: 5 * 60_000
  });

  const municipalities = React.useMemo(() => {
    const live = coverageQuery.data?.ok
      ? filterMunicipalityCoverage(coverageQuery.data.data.municipalities, {
          province: parcelQuery.province,
          district: parcelQuery.district
        })
      : [];
    return live.length > 0 ? live : FALLBACK_MUNICIPALITIES;
  }, [coverageQuery.data, parcelQuery.district, parcelQuery.province]);

  const selectedMunicipality = React.useMemo(
    () => municipalities.find((entry) => entry.id === selectedMunicipalityId) ?? null,
    [municipalities, selectedMunicipalityId]
  );

  const filteredMunicipalities = React.useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    if (!q) return municipalities;
    return municipalities.filter((entry) =>
      [entry.name, entry.province, entry.district, entry.municipalitySlug, entry.accessStatus, ...(entry.capabilities ?? [])]
        .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("tr-TR").includes(q))
    );
  }, [municipalities, query]);

  React.useEffect(() => {
    if (!selectedMunicipality && filteredMunicipalities[0] && !selectedMunicipalityId && !query.trim()) {
      setSelectedMunicipality({
        municipalityId: filteredMunicipalities[0].id,
        municipalityName: filteredMunicipalities[0].name,
        sourceId: filteredMunicipalities[0].id
      });
    }
  }, [filteredMunicipalities, query, selectedMunicipality, selectedMunicipalityId, setSelectedMunicipality]);

  async function runWorkflow() {
    setWorkflow((state) => ({ ...state, loading: true, error: null }));
    const result = await fetchMunicipalParcelWorkflow({
      province: parcelQuery.province || undefined,
      district: parcelQuery.district || undefined,
      municipalityId: parcelQuery.municipalityId || selectedMunicipality?.id || undefined,
      municipalitySlug: selectedMunicipality?.municipalitySlug || undefined,
      mahalle: parcelQuery.mahalle || undefined,
      ada: parcelQuery.ada || undefined,
      parsel: parcelQuery.parsel || undefined
    });
    if (result.ok) {
      setWorkflow({ loading: false, result: result.data, error: null });
      const data = result.data;
      const municipalityId =
        parcelQuery.municipalityId || selectedMunicipality?.id || data.query.municipalityId;
      const ada = data.parcelData?.ada ?? parcelQuery.ada;
      const parsel = data.parcelData?.parsel ?? parcelQuery.parsel;
      if (municipalityId && ada && parsel) {
        const parcelId = municipalParcelId(municipalityId, ada, parsel);
        const belediye = BELEDIYE_LIST.find((entry) => entry.id === municipalityId);
        const province = belediye
          ? PROVINCES.find((entry) => entry.slug === belediye.ilSlug)
          : undefined;
        const centroid = province?.centroid;
        upsertOverlayFromSearch({
          id: parcelId,
          type: "parcel",
          primary: `Ada/Parsel ${ada}/${parsel}`,
          secondary: selectedMunicipality?.name ?? municipalityId,
          meta: data.parcelData?.imarDurumu ?? "Belediye workflow",
          parcelId,
          zoningType: "Konut",
          municipalityId,
          sourceStatus: "live",
          centroid,
        });
        setSelectedParcelId(parcelId);
        setRightPanelOpen(true);
        if (centroid) {
          flyTo({ center: centroid, zoom: 16, parcelId });
        }
      } else {
        setSelectedParcelId(null);
        setRightPanelOpen(true);
      }
      return;
    }
    setWorkflow({ loading: false, result: null, error: result.error });
  }

  async function openCatalog() {
    const municipalityId = selectedMunicipality?.id;
    if (!municipalityId) return;
    setCatalog((state) => ({ ...state, loading: true, error: null }));
    const result = await fetchOgcCatalog(municipalityId, { service: "WMS" });
    if (!result.ok) {
      setCatalog({ loading: false, result: null, error: result.error });
      return;
    }
    setCatalog({ loading: false, result: result.data, error: null });
  }

  function toggleLayer(layer: OgcLayerCatalogEntry) {
    const layerName = layer.name ?? layer.title;
    if (!layerName || !catalog.result?.endpoint || !selectedMunicipality?.id) return;
    const layerId = `catalog-${selectedMunicipality.id}-${layerName}`.replace(/[^a-zA-Z0-9_-]/g, "-");
    const isActive = activeLayers.includes(layerName);
    if (isActive) {
      deactivateLiveLayer(layerId);
      setActiveLayers((current) => current.filter((value) => value !== layerName));
      return;
    }
    activateCatalogWmsLayer({
      sourceId: selectedMunicipality.id,
      endpoint: catalog.result.endpoint,
      layerName,
      title: layer.title ?? layerName,
    });
    setActiveLayers((current) => [...current, layerName]);
  }

  return (
    <section className="map-glass-shell pointer-events-auto overflow-hidden rounded-[1.75rem]">
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle/80 bg-surface-2/80 px-4 py-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-green">Belediye / veri durumu</div>
          <div className="text-sm font-black text-fg-primary">Kaynak seç, sorgula, alan kontratını gör</div>
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="soft-press inline-flex h-10 items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-3 text-sm font-semibold text-fg-primary hover:bg-white">
              <Building2 className="h-4 w-4 text-fg-muted" />
              <span className="max-w-[160px] truncate">{selectedMunicipality?.name ?? "Belediye seç"}</span>
              <ChevronDown className="h-3.5 w-3.5 text-fg-muted" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(440px,90vw)] p-0">
            <CommandRoot>
              <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
                <Search className="h-4 w-4 text-fg-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Belediye ara…"
                  className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-muted"
                />
                <Kbd combo={["Esc"]} />
              </div>
              <CommandList className="max-h-[360px]">
                {filteredMunicipalities.length === 0 ? (
                  <CommandEmpty>Bulunamadı</CommandEmpty>
                ) : (
                  <CommandGroup heading="Belediyeler">
                    {filteredMunicipalities.map((entry) => (
                      <CommandItem
                        key={entry.id}
                        selected={entry.id === selectedMunicipality?.id}
                        onSelectItem={() => {
                          setSelectedMunicipality({
                            municipalityId: entry.id,
                            municipalityName: entry.name,
                            sourceId: entry.id
                          });
                          setParcelQuery((state) => ({
                            ...state,
                            municipalityId: entry.id,
                            province: entry.province ?? state.province,
                            district: entry.district ?? state.district
                          }));
                          setOpen(false);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm">{entry.name}</span>
                            <span className="rounded-full border border-border-subtle px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-fg-muted">
                              {entry.accessStatus}
                            </span>
                          </div>
                          <div className="text-[11px] text-fg-muted">
                            {entry.province ?? "—"} · {entry.district ?? "—"}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </CommandRoot>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-3 p-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <MunicipalityStatusCard entry={selectedMunicipality} />
          <div className="grid gap-2 sm:grid-cols-2">
            <SelectField label="İl" value={parcelQuery.province} onChange={(value) => setParcelQuery((state) => ({ ...state, province: value }))}>
              <option value="">İl seç</option>
              {PROVINCES.map((province) => (
                <option key={province.slug} value={province.name}>{province.name}</option>
              ))}
            </SelectField>
            <SelectField label="İlçe / Belediye" value={parcelQuery.district} onChange={(value) => setParcelQuery((state) => ({ ...state, district: value }))}>
              <option value="">İlçe seç</option>
              {DISTRICTS.filter((district) => !parcelQuery.province || district.ilSlug === PROVINCES.find((province) => province.name === parcelQuery.province)?.slug).map((district) => (
                <option key={`${district.ilSlug}-${district.slug}`} value={district.name}>{district.name}</option>
              ))}
            </SelectField>
            <SelectField label="Mahalle (opsiyonel)" value={parcelQuery.mahalle} onChange={(value) => setParcelQuery((state) => ({ ...state, mahalle: value }))}>
              <option value="">Mahalle seç</option>
              {NEIGHBORHOODS.filter((neighborhood) => !parcelQuery.district || neighborhood.ilceSlug === DISTRICTS.find((district) => district.name === parcelQuery.district)?.slug).map((neighborhood) => (
                <option key={`${neighborhood.ilSlug}-${neighborhood.ilceSlug}-${neighborhood.slug}`} value={neighborhood.name}>{neighborhood.name}</option>
              ))}
            </SelectField>
            <div className="grid grid-cols-2 gap-2">
              <InputField label="Ada" value={parcelQuery.ada} onChange={(value) => setParcelQuery((state) => ({ ...state, ada: value }))} placeholder="1234" />
              <InputField label="Parsel" value={parcelQuery.parsel} onChange={(value) => setParcelQuery((state) => ({ ...state, parsel: value }))} placeholder="2" />
            </div>
          </div>
          <Button onClick={runWorkflow} className="w-full" size="sm" disabled={workflow.loading}>
            <Search className="h-4 w-4" />
            {workflow.loading ? "Sorgulanıyor…" : "Sorgula"}
          </Button>
        </div>

        <div className="space-y-3">
          <NoDataSummary workflow={workflow.result} selectedMunicipality={selectedMunicipality} />
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={openCatalog} disabled={!selectedMunicipality || catalog.loading}>
              <Layers3 className="h-4 w-4" />
              Katman katalogu
            </Button>
            <Button variant="ghost" size="sm" onClick={() => clearSelectedMunicipality()}>
              Sıfırla
            </Button>
          </div>
          {workflow.error && (
            <Notice tone="warning" title="Backend ulaşılamıyor">
              {workflow.error}
            </Notice>
          )}
          {workflow.result && (
            <ProvenanceCard workflow={workflow.result} />
          )}
          {catalog.result && (
            <LayerCatalogCard
              catalog={catalog.result}
              activeLayers={activeLayers}
              onToggleLayer={toggleLayer}
            />
          )}
          {catalog.error && <Notice tone="warning" title="Katalog okunamadı">{catalog.error}</Notice>}
        </div>
      </div>
    </section>
  );
}

function MunicipalityStatusCard({ entry }: { entry: MunicipalityCoverageEntry | null }) {
  if (!entry) {
    return <Notice tone="neutral" title="Belediye yok">Bir belediye seçin.</Notice>;
  }
  const capability = entry.capability;
  const reason = capability?.reasonNoData ?? "Kaynak durumu bilinmiyor";
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-fg-primary">{entry.name}</div>
          <div className="mt-0.5 text-[11px] text-fg-muted">{entry.province ?? "—"} · {entry.district ?? "—"}</div>
        </div>
        <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[11px] uppercase tracking-wider text-fg-muted">{entry.accessStatus}</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <MetaStat label="Kayıtlı kaynak" value={capability?.registered ? "var" : "yok"} />
        <MetaStat label="Public kaynak" value={capability?.publicCandidate ? "var" : "yok"} />
        <MetaStat label="İmar sorgusu" value={capability?.imarQuerySupport ?? "unknown"} />
        <MetaStat label="Parsel geometri" value={capability?.parcelGeometrySupport ?? "unknown"} />
      </div>
      <div className="mt-3 rounded-md border border-border-subtle bg-bg p-2.5 text-[11px] leading-relaxed text-fg-secondary">
        <div className="font-medium text-fg-primary">Kaynak / veri kontratı</div>
        <p className="mt-1">{reason}</p>
        <p className="mt-1 text-fg-muted">{capability?.nextAction ?? "Önce public registry doğrulaması gerekir."}</p>
      </div>
    </div>
  );
}

function NoDataSummary({ workflow, selectedMunicipality }: { workflow: MunicipalParcelWorkflowResponse | null; selectedMunicipality: MunicipalityCoverageEntry | null }) {
  const capability = workflow?.municipalityCapability ?? selectedMunicipality?.capability;
  const noData = workflow?.noDataReason ?? capability?.reasonNoData ?? "Sorgu için public kaynak durumu bekleniyor";
  const sourceCount = selectedMunicipality ? 1 : 0;
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 p-3 text-sm">
      <div className="flex items-center gap-2 text-fg-primary">
        <AlertCircle className="h-4 w-4 text-status-warning" />
        <span className="font-medium">Kaynak özeti</span>
      </div>
      <ul className="mt-2 space-y-1 text-[12px] text-fg-secondary">
        <li>Bu bölgede {sourceCount || 1} kayıtlı belediye kaynağı var.</li>
        <li>{capability?.publicCandidate ? "Public endpoint kaydı var." : "Public endpoint kaydı görünmüyor."}</li>
        <li>{capability?.protected ? "Kaynak login/captcha/legal gerektiriyor." : "Login/captcha gerektiren kaynak görünmüyor."}</li>
        <li>{noData}</li>
      </ul>
    </div>
  );
}

function ProvenanceCard({ workflow }: { workflow: MunicipalParcelWorkflowResponse }) {
  const rows = formatWorkflowProvenance(workflow);
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-fg-muted" />
        <div className="text-sm font-medium text-fg-primary">Provenance</div>
      </div>
      <div className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <div className="text-[12px] text-fg-muted">Provenance yok.</div>
        ) : rows.map((row) => (
          <div key={`${row.sourceId}-${row.fetchedAt}`} className="rounded-md border border-border-subtle bg-bg p-2">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-medium text-fg-primary">{row.sourceName ?? row.sourceId}</span>
              <span className="rounded-full border border-border-subtle px-1.5 py-0.5 uppercase tracking-wider text-fg-muted">{row.dataType}</span>
              <span className="text-fg-muted">{row.confidenceLabel}</span>
            </div>
            <div className="mt-1 space-y-0.5 text-[11px] text-fg-secondary">
              <div className="truncate">Endpoint: {row.endpoint}</div>
              <div>Fetched: {row.fetchedAt}</div>
              {row.responseHash && <div>Hash: {row.responseHash}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LayerCatalogCard({
  catalog,
  activeLayers,
  onToggleLayer
}: {
  catalog: OgcLayerCatalogResponse;
  activeLayers: string[];
  onToggleLayer: (layer: OgcLayerCatalogEntry) => void;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-fg-primary">Katman katalogu</div>
          <div className="text-[11px] text-fg-muted">{catalog.service} · {sanitizeEndpointUrl(catalog.endpoint)}</div>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {catalog.layers.length === 0 ? (
          <div className="text-[12px] text-fg-muted">
            {catalog.status === "unsupported_format" ? "WFS/WMS katalogu parse edilemedi." : "Katman bulunamadı."}
          </div>
        ) : (
          catalog.layers.map((layer) => {
            const normalized = normalizeOgcLayer(layer);
            const layerName = layer.name ?? layer.title ?? "";
            const active = activeLayers.includes(layerName);
            const wmsUrl = layer.name && catalog.endpoint ? buildWmsTileUrl(catalog.endpoint, layer.name) : null;
            return (
              <div key={`${layer.name ?? layer.title}`} className="rounded-md border border-border-subtle bg-bg p-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[12px] font-medium text-fg-primary">{normalized.title}</div>
                    <div className="text-[11px] text-fg-muted">{normalized.name}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleLayer(layer)}
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-1 text-[11px] uppercase tracking-wider",
                      active ? "border-brand-blue bg-brand-blue/10 text-brand-blue" : "border-border-subtle text-fg-secondary"
                    )}
                  >
                    {active ? "Açık" : "Aç"}
                  </button>
                </div>
                <div className="mt-2 grid gap-1 text-[11px] text-fg-secondary">
                  <div>CRS: {normalized.crs}</div>
                  <div>BBox: {normalized.bbox}</div>
                  <div>Queryable: {normalized.queryable ? "evet" : "hayır"}</div>
                </div>
                {wmsUrl && (
                  <a href={wmsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] text-brand-blue hover:underline">
                    GetMap URL
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {catalog.service === "WFS" && (
                  <div className="mt-2 rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-800">WFS: catalog only / vector ingestion not ready.</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-subtle bg-bg px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-fg-muted">{label}</div>
      <div className="mt-0.5 text-[12px] text-fg-primary">{value}</div>
    </div>
  );
}

function Notice({ title, children, tone }: { title: string; children: React.ReactNode; tone: "neutral" | "warning" }) {
  return (
    <div className={cn("rounded-lg border p-3 text-[12px]", tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-border-subtle bg-surface-1 text-fg-secondary")}>
      <div className="font-medium">{title}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-fg-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-border-subtle bg-bg px-3 text-sm text-fg-primary outline-none"
      >
        {children}
      </select>
    </label>
  );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-fg-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-border-subtle bg-bg px-3 text-sm text-fg-primary outline-none placeholder:text-fg-muted"
      />
    </label>
  );
}
