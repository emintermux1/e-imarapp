import { Injectable } from '@nestjs/common';
import { ConnectorKind, ProbeResult, ProbeStatus } from '../connectors/connector.types';
import { DiscoveryService } from '../connectors/discovery.service';
import { isProtectedSource, isPublicCandidateSource, summarizeSources } from './source-coverage';
import { SOURCE_REGISTRY, SourceAccessStatus, SourceCategory, SourceJurisdiction, SourceRegistryEntry } from './source-registry';

export type SourceActivationStatus = 'active' | 'blocked' | 'needs_contract' | 'unavailable' | 'metadata_only';

const LIVE_PUBLIC_CONNECTOR_KINDS = [ConnectorKind.NetcadKeos, ConnectorKind.Ekent, ConnectorKind.Ogc, ConnectorKind.ArcgisRest, ConnectorKind.MunicipalPortal, ConnectorKind.PublicPortal, ConnectorKind.PublicApi];

export interface SourceActivationRecord {
  sourceId: string;
  name: string;
  jurisdiction: SourceJurisdiction;
  category: SourceCategory;
  homepageUrl: string;
  accessStatus: SourceAccessStatus;
  runtimeStatus: SourceAccessStatus | 'captcha_required' | 'rate_limited' | 'endpoint_changed';
  activationStatus: SourceActivationStatus;
  capabilities: string[];
  connectorKinds: ConnectorKind[];
  usableEndpoints: string[];
  blockedReason?: string;
  nextAction: string;
  metadata?: SourceRegistryEntry['metadata'];
  provenance: Array<{
    sourceId: string;
    sourceName: string;
    endpoint: string;
    connectorKind?: ConnectorKind;
    status: string;
    confidence: number;
  }>;
  lastCheckedAt: string;
  cache?: {
    status: 'hit' | 'stored' | 'registry_only';
    ttlSeconds?: number;
  };
}

@Injectable()
export class SourceActivationService {
  private readonly liveCache = new Map<string, { expiresAt: number; record: SourceActivationRecord }>();
  private readonly liveCacheTtlMs = 15 * 60 * 1000;

  constructor(private readonly discovery?: DiscoveryService) {}

  activationSummary(records: SourceActivationRecord[] = this.activation({ liveCheck: false }).sources) {
    const byActivationStatus = this.countBy(records, (record) => record.activationStatus);
    const byCategory = this.countBy(records, (record) => record.category);
    const byJurisdiction = this.countBy(records, (record) => record.jurisdiction);
    return {
      total: records.length,
      active: byActivationStatus.active ?? 0,
      blocked: byActivationStatus.blocked ?? 0,
      needsContract: byActivationStatus.needs_contract ?? 0,
      metadataOnly: byActivationStatus.metadata_only ?? 0,
      unavailable: byActivationStatus.unavailable ?? 0,
      byActivationStatus,
      byCategory,
      byJurisdiction,
      registryCoverage: summarizeSources(SOURCE_REGISTRY)
    };
  }

  activation(options: { liveCheck?: boolean; limit?: number; sourceIds?: string[] } = {}) {
    const generatedAt = new Date().toISOString();
    const sourceIds = options.sourceIds ? new Set(options.sourceIds) : undefined;
    const sources = SOURCE_REGISTRY.filter((source) => !sourceIds || sourceIds.has(source.id));
    const records = sources.map((source) => this.registryOnlyRecord(source, generatedAt));
    return {
      status: 'ok',
      generatedAt,
      liveChecked: options.liveCheck === true,
      summary: this.activationSummary(records),
      sources: records.slice(0, this.clampLimit(options.limit, records.length))
    };
  }

  async activateLive(options: { limit?: number; sourceIds?: string[]; force?: boolean } = {}) {
    if (!this.discovery) return this.activation({ ...options, liveCheck: false });
    const generatedAt = new Date().toISOString();
    const sourceIds = options.sourceIds ? new Set(options.sourceIds) : undefined;
    const sources = SOURCE_REGISTRY.filter((source) => !sourceIds || sourceIds.has(source.id)).slice(0, this.clampLimit(options.limit, SOURCE_REGISTRY.length));
    const records: SourceActivationRecord[] = [];
    for (const source of sources) {
      if (isProtectedSource(source)) {
        records.push(this.registryOnlyRecord(source, generatedAt));
        continue;
      }
      const cached = options.force ? undefined : this.cachedLiveRecord(source.id, generatedAt);
      if (cached) {
        records.push(cached);
        continue;
      }
      try {
        const discovered = await this.discovery.discoverSource(source.id);
        records.push(this.storeLiveRecord(source.id, this.liveRecord(source, discovered.probes, generatedAt), generatedAt));
      } catch {
        records.push({ ...this.registryOnlyRecord(source, generatedAt), activationStatus: 'unavailable', runtimeStatus: 'endpoint_changed', blockedReason: 'probe_failed', nextAction: 'Canlı discovery başarısız oldu; daha düşük hızla veya manuel resmi portal kontrolüyle tekrar deneyin.' });
      }
    }
    return { status: 'ok', generatedAt, liveChecked: true, summary: this.activationSummary(records), sources: records };
  }

  activationForSource(source: SourceRegistryEntry, probes?: ProbeResult[]): SourceActivationRecord {
    const generatedAt = new Date().toISOString();
    return probes ? this.liveRecord(source, probes, generatedAt) : this.registryOnlyRecord(source, generatedAt);
  }

  private registryOnlyRecord(source: SourceRegistryEntry, generatedAt: string): SourceActivationRecord {
    const protectedSource = isProtectedSource(source);
    const metadataOnly = source.access.status === 'public_metadata' || source.access.status === 'metadata_only';
    const publicLiveCandidate = source.access.status === 'public' && source.connectorKinds.some((kind) => LIVE_PUBLIC_CONNECTOR_KINDS.includes(kind));
    const needsContract = source.access.status === 'unknown' && source.connectorKinds.some((kind) => [ConnectorKind.NetcadKeos, ConnectorKind.Ekent, ConnectorKind.Ogc, ConnectorKind.ArcgisRest].includes(kind));
    const activationStatus: SourceActivationStatus = protectedSource
      ? 'blocked'
      : publicLiveCandidate
        ? 'active'
        : needsContract
          ? 'needs_contract'
          : metadataOnly
            ? 'metadata_only'
            : isPublicCandidateSource(source)
              ? 'needs_contract'
              : 'unavailable';
    return {
      sourceId: source.id,
      name: source.name,
      jurisdiction: source.jurisdiction,
      category: source.category,
      homepageUrl: source.homepageUrl,
      accessStatus: source.access.status,
      runtimeStatus: source.access.status,
      activationStatus,
      capabilities: source.capabilities,
      connectorKinds: source.connectorKinds,
      usableEndpoints: publicLiveCandidate ? [source.homepageUrl] : [],
      blockedReason: protectedSource ? source.access.status : undefined,
      nextAction: this.nextActionForRegistry(source, activationStatus),
      metadata: source.metadata,
      provenance: [{
        sourceId: source.id,
        sourceName: source.name,
        endpoint: source.homepageUrl,
        connectorKind: source.connectorKinds[0],
        status: 'registry_metadata',
        confidence: publicLiveCandidate ? 0.7 : metadataOnly ? 0.55 : 0.4
      }],
      lastCheckedAt: generatedAt,
      cache: { status: 'registry_only' }
    };
  }

  private liveRecord(source: SourceRegistryEntry, probes: ProbeResult[], generatedAt: string): SourceActivationRecord {
    const priority = [ProbeStatus.Available, ProbeStatus.MethodContractRequired, ProbeStatus.CaptchaRequired, ProbeStatus.RequiresCredentials, ProbeStatus.RequiresLegalAgreement, ProbeStatus.RateLimited, ProbeStatus.EndpointChanged, ProbeStatus.Unavailable, ProbeStatus.UnsupportedFormat];
    const best = probes.slice().sort((a, b) => priority.indexOf(a.status) - priority.indexOf(b.status))[0];
    const usable = probes.filter((probe) => probe.status === ProbeStatus.Available || probe.status === ProbeStatus.MethodContractRequired);
    const activationStatus = this.activationStatusForProbe(source, best?.status);
    return {
      ...this.registryOnlyRecord(source, generatedAt),
      runtimeStatus: this.runtimeStatusForProbe(source.access.status, best?.status),
      activationStatus,
      usableEndpoints: usable.map((probe) => probe.endpoint),
      blockedReason: this.blockedReasonForProbe(best?.status),
      nextAction: this.nextActionForProbe(best?.status, activationStatus),
      provenance: probes.slice(0, 8).map((probe) => ({
        sourceId: source.id,
        sourceName: source.name,
        endpoint: probe.endpoint,
        connectorKind: probe.detectedKinds[0] ?? source.connectorKinds[0],
        status: probe.status,
        confidence: probe.status === ProbeStatus.Available ? 0.85 : probe.status === ProbeStatus.MethodContractRequired ? 0.7 : 0.45
      })),
      cache: { status: 'stored', ttlSeconds: Math.trunc(this.liveCacheTtlMs / 1000) }
    };
  }

  private cachedLiveRecord(sourceId: string, generatedAt: string): SourceActivationRecord | undefined {
    const cached = this.liveCache.get(sourceId);
    if (!cached) return undefined;
    if (cached.expiresAt <= Date.now()) {
      this.liveCache.delete(sourceId);
      return undefined;
    }
    return {
      ...cached.record,
      lastCheckedAt: generatedAt,
      cache: { status: 'hit', ttlSeconds: Math.max(0, Math.ceil((cached.expiresAt - Date.now()) / 1000)) }
    };
  }

  private storeLiveRecord(sourceId: string, record: SourceActivationRecord, generatedAt: string): SourceActivationRecord {
    const stored = {
      ...record,
      lastCheckedAt: generatedAt,
      cache: { status: 'stored' as const, ttlSeconds: Math.trunc(this.liveCacheTtlMs / 1000) }
    };
    this.liveCache.set(sourceId, { expiresAt: Date.now() + this.liveCacheTtlMs, record: stored });
    return stored;
  }

  private activationStatusForProbe(source: SourceRegistryEntry, status?: ProbeStatus): SourceActivationStatus {
    if (status === ProbeStatus.Available) return 'active';
    if (status === ProbeStatus.MethodContractRequired) return 'active';
    if ([ProbeStatus.CaptchaRequired, ProbeStatus.RequiresCredentials, ProbeStatus.RequiresLegalAgreement].includes(status as ProbeStatus)) return 'blocked';
    if (status === ProbeStatus.RateLimited) return 'unavailable';
    if (source.access.status === 'public_metadata' || source.access.status === 'metadata_only') return 'metadata_only';
    return 'unavailable';
  }

  private runtimeStatusForProbe(fallback: SourceAccessStatus, status?: ProbeStatus): SourceActivationRecord['runtimeStatus'] {
    if (status === ProbeStatus.CaptchaRequired) return 'captcha_required';
    if (status === ProbeStatus.RequiresCredentials) return 'requires_credentials';
    if (status === ProbeStatus.RequiresLegalAgreement) return 'requires_legal_agreement';
    if (status === ProbeStatus.RateLimited) return 'rate_limited';
    if (status === ProbeStatus.EndpointChanged) return 'endpoint_changed';
    if (status === ProbeStatus.Available) return 'public';
    if (status === ProbeStatus.MethodContractRequired) return 'public';
    return fallback;
  }

  private blockedReasonForProbe(status?: ProbeStatus): string | undefined {
    if (status === ProbeStatus.CaptchaRequired) return 'captcha_required';
    if (status === ProbeStatus.RequiresCredentials) return 'requires_credentials';
    if (status === ProbeStatus.RequiresLegalAgreement) return 'requires_legal_agreement';
    if (status === ProbeStatus.RateLimited) return 'rate_limited';
    return undefined;
  }

  private nextActionForRegistry(source: SourceRegistryEntry, status: SourceActivationStatus): string {
    if (status === 'blocked') return source.access.status === 'requires_legal_agreement' ? 'Resmi veri paylaşım protokolü ve kurum erişimi tanımlayın.' : 'Kurumsal credential/OAuth akışını yasal erişimle yapılandırın.';
    if (status === 'metadata_only') return 'Public katalog/metadata gösterilir; canlı veri için endpoint discovery çalıştırın.';
    if (status === 'needs_contract') return 'Public discovery ile servis metodu ve dönen alanları çözün.';
    if (status === 'active') return 'Public portal canlı kaynak olarak kullanılabilir; endpoint/provenance çözülerek bilgi amaçlı imar alanları gösterilir.';
    return 'Kaynak portalı manuel doğrulanmalı veya registry güncellenmeli.';
  }

  private nextActionForProbe(status: ProbeStatus | undefined, activationStatus: SourceActivationStatus): string {
    if (status === ProbeStatus.Available) return 'Public endpoint aktif; normalize edip provenance ile kullanın.';
    if (status === ProbeStatus.MethodContractRequired) return 'Public endpoint cevap verdi; WSDL/OGC/REST alanlarını provenance ile çözerek normalize edin.';
    if (status === ProbeStatus.CaptchaRequired) return 'Captcha tespit edildi; otomatik discovery durduruldu.';
    if (status === ProbeStatus.RequiresCredentials) return 'Onaylı credential/OAuth akışı olmadan çağrı yapılmayacak.';
    if (status === ProbeStatus.RequiresLegalAgreement) return 'Resmi veri paylaşım protokolü gerekiyor.';
    if (status === ProbeStatus.RateLimited) return 'Rate limit görüldü; geri çekil ve daha düşük hızla tekrar dene.';
    return this.nextActionForRegistry({ access: { status: 'unknown', notes: '' } } as SourceRegistryEntry, activationStatus);
  }

  private countBy<T>(items: T[], getter: (item: T) => string): Record<string, number> {
    return items.reduce<Record<string, number>>((acc, item) => {
      const key = getter(item);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }

  private clampLimit(limit: number | undefined, fallback: number): number {
    if (!limit || !Number.isFinite(limit)) return fallback;
    return Math.max(1, Math.min(100, Math.trunc(limit)));
  }
}
