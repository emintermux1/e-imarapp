import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { MunicipalOgcDiscoveryResult, OgcDiscoveryService } from '../connectors/ogc-discovery.service';
import { findMunicipalRegistryEntry, MunicipalRegistryEntry } from '../sources/municipal-registry';
import { SOURCE_REGISTRY, SourceRegistryEntry } from '../sources/source-registry';
import { SourcesService } from '../sources/sources.service';

export interface MunicipalDiscoveryResponse {
  slug: string;
  name: string;
  source_id?: string | null;
  tested_patterns: number;
  live_endpoints: Array<Record<string, unknown>>;
  keos_url?: string | null;
  wms_url?: string | null;
  wfs_url?: string | null;
  discovered_at: string;
  refresh_after?: string | null;
  ogc: MunicipalOgcDiscoveryResult;
}

const REFRESH_DAYS = 7;

@Injectable()
export class MunicipalGisDiscoveryService {
  private readonly cache = new Map<string, { expiresAt: number; payload: MunicipalDiscoveryResponse }>();

  constructor(
    private readonly ogc: OgcDiscoveryService,
    private readonly db: DatabaseService,
    private readonly sources: SourcesService
  ) {}

  resolve(slug: string): { registry: MunicipalRegistryEntry | null; source: SourceRegistryEntry | null } {
    const normalized = slug.trim().toLowerCase();
    const registry = findMunicipalRegistryEntry(normalized) ?? null;
    const source =
      this.sources.findMunicipality({ municipalitySlug: normalized, id: normalized }) ??
      SOURCE_REGISTRY.find((entry) => entry.metadata?.municipalitySlug === normalized || entry.id.startsWith(`${normalized}-`)) ??
      null;
    return { registry, source };
  }

  async discover(slug: string, force = false): Promise<MunicipalDiscoveryResponse> {
    const { registry, source } = this.resolve(slug);
    const cacheKey = registry?.id ?? source?.metadata?.municipalitySlug ?? slug;
    const cached = this.cache.get(cacheKey);
    if (!force && cached && cached.expiresAt > Date.now()) return cached.payload;

    if (!force) {
      const persisted = await this.readPersisted(cacheKey, source?.id);
      if (persisted) {
        this.cache.set(cacheKey, { expiresAt: Date.parse(persisted.refresh_after ?? '') || Date.now() + REFRESH_DAYS * 86400000, payload: persisted });
        return persisted;
      }
    }

    const homepage = source?.homepageUrl ?? registry?.baseUrl ?? '';
    const seeds = [homepage, registry?.baseUrl, ...(homepage ? this.ogc.buildNetcadCandidateRoots(homepage) : [])].filter(Boolean) as string[];
    const ogc = await this.ogc.discoverMunicipalEndpoints(seeds);
    const liveEndpoints = this.buildLiveEndpoints(ogc, homepage);
    const payload: MunicipalDiscoveryResponse = {
      slug: registry?.id ?? source?.metadata?.municipalitySlug ?? slug,
      name: source?.name ?? registry?.name ?? slug,
      source_id: source?.id ?? null,
      tested_patterns: ogc.tested_urls.length,
      live_endpoints: liveEndpoints,
      keos_url: homepage || ogc.base_url,
      wms_url: ogc.wms_url,
      wfs_url: ogc.wfs_url,
      discovered_at: ogc.discovered_at,
      refresh_after: ogc.refresh_after,
      ogc
    };

    await this.persist(payload);
    this.cache.set(cacheKey, { expiresAt: Date.parse(ogc.refresh_after) || Date.now() + REFRESH_DAYS * 86400000, payload });
    return payload;
  }

  async listEndpoints(slug: string): Promise<Array<Record<string, unknown>>> {
    const { source } = this.resolve(slug);
    if (!this.db.isConfigured() || !source?.id) {
      const discovery = await this.discover(slug, false);
      return discovery.ogc.status === 'available' ? [this.endpointRecordFromDiscovery(discovery)] : [];
    }
    const result = await this.db.query<{
      id: string;
      source_id: string;
      municipality_id: string | null;
      base_url: string;
      wms_url: string;
      wms_get_capabilities_url: string;
      wms_version: string | null;
      wfs_url: string | null;
      wfs_get_capabilities_url: string | null;
      available_layers: unknown;
      supported_srs: string[];
      supported_formats: string[];
      status: string;
      discovered_at: Date;
      refresh_after: Date;
      last_error: string | null;
      metadata: Record<string, unknown>;
      created_at: Date;
      updated_at: Date;
    }>(
      `select * from municipal_gis_endpoints
       where source_id = $1
       order by discovered_at desc
       limit 20`,
      [source.id]
    );
    if (result.rows.length) {
      return result.rows.map((row) => ({
        id: row.id,
        source_id: row.source_id,
        municipality_id: row.municipality_id,
        base_url: row.base_url,
        wms_url: row.wms_url,
        wms_get_capabilities_url: row.wms_get_capabilities_url,
        wms_version: row.wms_version,
        wfs_url: row.wfs_url,
        wfs_get_capabilities_url: row.wfs_get_capabilities_url,
        available_layers: row.available_layers,
        supported_srs: row.supported_srs,
        supported_formats: row.supported_formats,
        status: row.status,
        discovered_at: row.discovered_at.toISOString(),
        refresh_after: row.refresh_after.toISOString(),
        last_error: row.last_error,
        metadata: row.metadata,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString()
      }));
    }
    const discovery = await this.discover(slug, false);
    return discovery.ogc.status === 'available' ? [this.endpointRecordFromDiscovery(discovery)] : [];
  }

  pickParcelLayer(layers: Array<{ name?: string; title?: string }>): string | undefined {
    const hints = ['parsel', 'pars_el', 'parcel', 'ada', 'imar_durumu', 'imar'];
    for (const hint of hints) {
      const match = layers.find((layer) => {
        const haystack = `${layer.name ?? ''} ${layer.title ?? ''}`.toLocaleLowerCase('tr-TR');
        return haystack.includes(hint);
      });
      if (match?.name) return match.name;
    }
    return layers.find((layer) => layer.name)?.name;
  }

  private buildLiveEndpoints(ogc: MunicipalOgcDiscoveryResult, homepage: string): Array<Record<string, unknown>> {
    const endpoints: Array<Record<string, unknown>> = [];
    if (homepage) endpoints.push({ url: homepage, status: 'live', type: 'keos', live: true });
    if (ogc.wms_url) endpoints.push({ url: ogc.wms_url, status: 'live', type: 'wms', live: true });
    if (ogc.wfs_url) endpoints.push({ url: ogc.wfs_url, status: 'live', type: 'wfs', live: true });
    return endpoints;
  }

  private endpointRecordFromDiscovery(discovery: MunicipalDiscoveryResponse): Record<string, unknown> {
    const now = discovery.discovered_at;
    return {
      id: `${discovery.source_id ?? discovery.slug}:discovered`,
      source_id: discovery.source_id ?? discovery.slug,
      municipality_id: null,
      base_url: discovery.ogc.base_url ?? discovery.keos_url ?? '',
      wms_url: discovery.wms_url ?? '',
      wms_get_capabilities_url: discovery.ogc.wms_get_capabilities_url ?? '',
      wms_version: discovery.ogc.wms_version ?? null,
      wfs_url: discovery.wfs_url ?? null,
      wfs_get_capabilities_url: discovery.ogc.wfs_get_capabilities_url ?? null,
      available_layers: discovery.ogc.available_layers,
      supported_srs: discovery.ogc.supported_srs,
      supported_formats: discovery.ogc.supported_formats,
      status: discovery.ogc.status,
      discovered_at: now,
      refresh_after: discovery.refresh_after ?? now,
      last_error: discovery.ogc.last_error ?? null,
      metadata: discovery.ogc.metadata,
      created_at: now,
      updated_at: now
    };
  }

  private async readPersisted(slug: string, sourceId?: string): Promise<MunicipalDiscoveryResponse | null> {
    if (!this.db.isConfigured() || !sourceId) return null;
    const result = await this.db.query<{
      base_url: string;
      wms_url: string;
      wms_get_capabilities_url: string;
      wms_version: string | null;
      wfs_url: string | null;
      wfs_get_capabilities_url: string | null;
      available_layers: MunicipalOgcDiscoveryResult['available_layers'];
      supported_srs: string[];
      supported_formats: string[];
      status: string;
      discovered_at: Date;
      refresh_after: Date;
      last_error: string | null;
      metadata: Record<string, unknown>;
    }>(
      `select * from municipal_gis_endpoints
       where source_id = $1 and refresh_after > now()
       order by discovered_at desc
       limit 1`,
      [sourceId]
    );
    const row = result.rows[0];
    if (!row) return null;
    const { registry, source } = this.resolve(slug);
    const ogc: MunicipalOgcDiscoveryResult = {
      status: row.status as MunicipalOgcDiscoveryResult['status'],
      base_url: row.base_url,
      wms_url: row.wms_url,
      wms_get_capabilities_url: row.wms_get_capabilities_url,
      wms_version: row.wms_version,
      wfs_url: row.wfs_url,
      wfs_get_capabilities_url: row.wfs_get_capabilities_url,
      available_layers: row.available_layers ?? [],
      supported_srs: row.supported_srs ?? [],
      supported_formats: row.supported_formats ?? [],
      metadata: row.metadata ?? {},
      last_error: row.last_error,
      tested_urls: [],
      discovered_at: row.discovered_at.toISOString(),
      refresh_after: row.refresh_after.toISOString()
    };
    return {
      slug: registry?.id ?? slug,
      name: source?.name ?? registry?.name ?? slug,
      source_id: sourceId,
      tested_patterns: 0,
      live_endpoints: this.buildLiveEndpoints(ogc, source?.homepageUrl ?? registry?.baseUrl ?? ''),
      keos_url: source?.homepageUrl ?? registry?.baseUrl ?? row.base_url,
      wms_url: row.wms_url,
      wfs_url: row.wfs_url,
      discovered_at: row.discovered_at.toISOString(),
      refresh_after: row.refresh_after.toISOString(),
      ogc
    };
  }

  private async persist(discovery: MunicipalDiscoveryResponse): Promise<void> {
    if (!this.db.isConfigured() || !discovery.source_id) return;
    const sourceExists = await this.db.query('select 1 from data_sources where id = $1 limit 1', [discovery.source_id]);
    if (!sourceExists.rowCount) return;

    const ogc = discovery.ogc;
    const baseUrl = ogc.base_url ?? discovery.keos_url ?? discovery.slug;
    await this.db.query(
      `insert into municipal_gis_endpoints (
         source_id, municipality_id, base_url, wms_url, wms_get_capabilities_url, wms_version,
         wfs_url, wfs_get_capabilities_url, available_layers, supported_srs, supported_formats,
         status, discovered_at, refresh_after, last_error, metadata, updated_at
       ) values (
         $1, null, $2, $3, $4, $5,
         $6, $7, $8::jsonb, $9, $10,
         $11, $12, $13, $14, $15::jsonb, now()
       )
       on conflict (source_id, base_url) do update set
         wms_url = excluded.wms_url,
         wms_get_capabilities_url = excluded.wms_get_capabilities_url,
         wms_version = excluded.wms_version,
         wfs_url = excluded.wfs_url,
         wfs_get_capabilities_url = excluded.wfs_get_capabilities_url,
         available_layers = excluded.available_layers,
         supported_srs = excluded.supported_srs,
         supported_formats = excluded.supported_formats,
         status = excluded.status,
         discovered_at = excluded.discovered_at,
         refresh_after = excluded.refresh_after,
         last_error = excluded.last_error,
         metadata = excluded.metadata,
         updated_at = now()`,
      [
        discovery.source_id,
        baseUrl,
        ogc.wms_url ?? '',
        ogc.wms_get_capabilities_url ?? ogc.wms_url ?? '',
        ogc.wms_version ?? null,
        ogc.wfs_url ?? null,
        ogc.wfs_get_capabilities_url ?? null,
        JSON.stringify(ogc.available_layers ?? []),
        ogc.supported_srs ?? [],
        ogc.supported_formats ?? [],
        ogc.status,
        ogc.discovered_at,
        ogc.refresh_after,
        ogc.last_error ?? null,
        JSON.stringify(ogc.metadata ?? {})
      ]
    );
  }
}
