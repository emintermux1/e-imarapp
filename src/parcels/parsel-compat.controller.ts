import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { ParcelsService } from './parcels.service';

type ParcelEnvelope = {
  status?: string;
  parcels?: Array<Record<string, unknown>>;
  count?: number;
  issue?: { message?: string };
};

const WATCHLIST = new Map<string, Record<string, unknown>>();
const REPORTS = new Map<number, Record<string, unknown>>();
const PARCEL_CACHE = new Map<number, Record<string, unknown>>();

@Controller(['parsel', 'api/v1/parsel'])
export class ParselCompatController {
  constructor(private readonly parcels: ParcelsService) {}

  @Get('search')
  async search(@Query('query') query?: string, @Query('limit') limit?: string) {
    return this.queryParcels({ query, limit });
  }

  @Get()
  async lookup(
    @Query('ada') ada?: string,
    @Query('parsel') parsel?: string,
    @Query('il') il?: string,
    @Query('ilce') ilce?: string,
    @Query('limit') limit?: string
  ) {
    return this.queryParcels({ ada, parsel, il, ilce, limit });
  }

  @Get('geometry/:id')
  async geometry(@Param('id') id: string) {
    const parcel = await this.findByCompatId(id);
    return parcel?.geometri ?? parcel?.geometry ?? {
      status: 'not_ready',
      message: 'Parsel geometrisi PostGIS veri seti veya canlı kaynak doğrulaması olmadan yayınlanamaz.'
    };
  }

  @Get(':id/context')
  async context(@Param('id') id: string, @Query('include_geometry') includeGeometry?: string) {
    const parcel = await this.findByCompatId(id);
    return this.buildContext(parcel, includeGeometry === 'true');
  }

  @Get(':id/related-plans')
  async relatedPlans(@Param('id') id: string) {
    const parcel = await this.findByCompatId(id);
    return {
      ...this.buildContext(parcel, false),
      message: 'Plan eşleşmesi için e-Plan/PostGIS plan tablosu hazır olduğunda spatial ilişki kurulacak.'
    };
  }

  @Get(':id/summary')
  async summary(@Param('id') id: string) {
    const parcel = await this.findByCompatId(id);
    const safeParcel = parcel ?? this.placeholderParcel(id);
    return {
      parcel: safeParcel,
      location: {
        il: safeParcel.il ?? null,
        ilce: safeParcel.ilce ?? null,
        mahalle: safeParcel.mahalle ?? null,
        municipality: safeParcel.source_municipality ?? safeParcel.municipalityId ?? null
      },
      geometry_status: safeParcel.geometri || safeParcel.geometry ? 'available' : 'missing',
      source_trust: safeParcel.source ?? {
        source_id: safeParcel.source_id ?? null,
        source_name: safeParcel.source_name ?? null,
        source_status: safeParcel.source_status ?? 'not_ready',
        source_message: 'Compatibility endpoint; resmi veri üretmez.'
      },
      related_plan_count: 0,
      related_aski_count: 0,
      report_eligibility: parcel ? 'limited' : 'limited',
      warnings: [
        parcel
          ? 'İmar planı/askı spatial eşleşmesi henüz canlı veriye bağlanmadı.'
          : 'Parsel kaydı bulunamadı veya DATABASE_URL yapılandırılmadı.'
      ],
      generated_at: new Date().toISOString()
    };
  }

  private async queryParcels(input: {
    query?: string;
    ada?: string;
    parsel?: string;
    il?: string;
    ilce?: string;
    limit?: string;
  }) {
    const match = input.query?.trim().match(/^(\d+)\s*[/-]\s*(\d+)$/);
    const ada = input.ada ?? match?.[1];
    const parselNo = input.parsel ?? match?.[2];
    const response = await this.parcels.queryParcel({
      type: ada && parselNo ? 'ada_parsel' : 'address',
      ada,
      parselNo,
      address: input.query,
      limit: this.parseLimit(input.limit)
    } as never) as ParcelEnvelope;
    return (response.parcels ?? []).map((parcel) => this.toFrontendParcel(parcel, input.il, input.ilce));
  }

  private async findByCompatId(id: string): Promise<Record<string, unknown> | null> {
    const numeric = this.toNumber(id);
    if (numeric !== undefined) {
      const cached = PARCEL_CACHE.get(numeric);
      if (cached) return { ...cached };
    }

    const response = await this.parcels.queryParcel({
      type: 'ada_parsel',
      sourceId: id,
      limit: 1
    } as never) as ParcelEnvelope;
    const parcel = response.parcels?.[0];
    return parcel ? this.toFrontendParcel(parcel) : null;
  }

  private buildContext(parcel: Record<string, unknown> | null, includeGeometry: boolean) {
    const safeParcel = parcel ?? this.placeholderParcel('unknown');
    if (!includeGeometry) delete safeParcel.geometri;
    return {
      parcel: safeParcel,
      quality: {
        geometry_available: Boolean(safeParcel.geometri ?? safeParcel.geometry),
        source_status: safeParcel.source_status ?? 'not_ready',
        source_name: safeParcel.source_name ?? null,
        source_municipality: safeParcel.source_municipality ?? null,
        source_provider: safeParcel.source_provider ?? null,
        confidence: parcel ? 0.45 : 0,
        confidence_label: parcel ? 'medium' : 'low',
        quality_hints: [
          parcel
            ? 'Parsel verisi backend query contract üzerinden döndü; plan ve askı eşleşmesi ayrıca doğrulanmalı.'
            : 'Parsel verisi bulunamadı veya PostGIS yapılandırılmadı.'
        ],
        plan_match_status: 'unknown',
        aski_match_status: 'unknown',
        imar_params_status: 'unknown',
        message: 'Compatibility response; resmi belge değildir.'
      },
      match_method: 'none',
      related_plans: [],
      active_aski_plans: [],
      total_related: 0,
      geometry_included: includeGeometry,
      history_available: false,
      generated_at: new Date().toISOString(),
      message: 'Plan/askı context için e-Plan ve belediye spatial contract doğrulaması bekleniyor.'
    };
  }

  private toFrontendParcel(parcel: Record<string, unknown>, il?: string, ilce?: string): Record<string, unknown> {
    const id = this.numericId(parcel.id ?? parcel.externalId ?? `${parcel.ada}/${parcel.parselNo}`);
    const source = parcel.source && typeof parcel.source === 'object' ? parcel.source as Record<string, unknown> : {};
    const normalized = {
      id,
      ada: String(parcel.ada ?? ''),
      parsel: String(parcel.parselNo ?? parcel.parsel ?? ''),
      il: il ?? this.readString(parcel.attributes, ['il', 'province']) ?? null,
      ilce: ilce ?? this.readString(parcel.attributes, ['ilce', 'district']) ?? null,
      mahalle: this.readString(parcel.attributes, ['mahalle', 'neighborhood', 'mevkii']) ?? null,
      nitelik: this.readString(parcel.attributes, ['nitelik', 'land_use']) ?? null,
      alan_m2: this.toNumber(parcel.areaM2),
      tapu_durumu: this.readString(parcel.attributes, ['tapu_durumu']) ?? null,
      geometri: parcel.geometry ?? null,
      geometry_available: Boolean(parcel.geometry),
      source_status: source.accessStatus === 'public' ? 'live' : 'public_metadata',
      source_name: source.name ?? null,
      source_municipality: parcel.municipalityId ?? null,
      source_provider: source.category ?? null,
      source: {
        source_id: source.sourceId ?? parcel.sourceId ?? null,
        source_name: source.name ?? null,
        municipality: parcel.municipalityId ?? null,
        provider: source.category ?? null,
        source_status: source.accessStatus === 'public' ? 'live' : 'public_metadata',
        source_message: 'Backend parsel query compatibility endpoint.'
      },
      confidence: parcel.geometry ? 0.7 : 0.45,
      confidence_label: parcel.geometry ? 'medium' : 'low',
      quality_hints: ['Resmi veri üretimi yapılmadı; mevcut backend kaydı frontend contractına normalize edildi.'],
      plan_match_status: 'unknown',
      aski_match_status: 'unknown',
      imar_params_status: 'unknown',
      status_message: 'Plan ve askı parametreleri doğrulanmadı.'
    };
    PARCEL_CACHE.set(id, normalized);
    return { ...normalized };
  }

  private placeholderParcel(id: string): Record<string, unknown> {
    return {
      id: this.numericId(id),
      ada: '—',
      parsel: '—',
      source_status: 'not_ready',
      geometry_available: false
    };
  }

  private parseLimit(limit?: string): number {
    const parsed = Number(limit);
    return Number.isFinite(parsed) ? Math.max(1, Math.min(100, Math.trunc(parsed))) : 20;
  }

  private numericId(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
    if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
    return parseInt(createHash('sha1').update(String(value ?? randomUUID())).digest('hex').slice(0, 8), 16);
  }

  private toNumber(value: unknown): number | undefined {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  private readString(source: unknown, keys: string[]): string | undefined {
    if (!source || typeof source !== 'object') return undefined;
    const record = source as Record<string, unknown>;
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return undefined;
  }
}

@Controller(['watchlist', 'api/v1/watchlist'])
export class WatchlistCompatController {
  @Get()
  listWatchlist() {
    return [...WATCHLIST.values()];
  }

  @Post()
  createWatchlist(@Body() body: Record<string, unknown>) {
    const id = randomUUID();
    const item = { id, status: 'accepted_local', created_at: new Date().toISOString(), ...body };
    WATCHLIST.set(id, item);
    return item;
  }

  @Delete(':id')
  deleteWatchlist(@Param('id') id: string) {
    const deleted = WATCHLIST.delete(id);
    return { status: deleted ? 'deleted' : 'not_found', id };
  }
}

@Controller(['reports', 'api/v1/reports'])
export class ReportsCompatController {
  @Get()
  listReports() {
    return Array.from(REPORTS.values()).sort((a, b) => {
      const left = String(b.generated_at ?? "");
      const right = String(a.generated_at ?? "");
      return left.localeCompare(right);
    });
  }

  @Post('generate')
  generateReport(@Body() body: Record<string, unknown>) {
    const id = this.numericId(randomUUID());
    const report = {
      id,
      user_id: 0,
      parcel_id: this.toNumber(body.parcel_id),
      plan_id: this.toNumber(body.plan_id),
      status: 'not_ready',
      pdf_url: undefined,
      generated_at: new Date().toISOString(),
      message: 'PDF üretimi için storage/renderer pipeline hazır değil; UI bu yanıtı bekleyen rapor olarak gösterebilir.'
    };
    REPORTS.set(id, report);
    return report;
  }

  @Get(':id')
  getReport(@Param('id') id: string) {
    const numeric = this.toNumber(id);
    return numeric && REPORTS.has(numeric)
      ? REPORTS.get(numeric)
      : {
          id: numeric ?? this.numericId(id),
          user_id: 0,
          status: 'not_ready',
          message: 'Rapor kaydı bu çalışma zamanı belleğinde bulunamadı.'
        };
  }

  private numericId(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
    if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
    return parseInt(createHash('sha1').update(String(value ?? randomUUID())).digest('hex').slice(0, 8), 16);
  }

  private toNumber(value: unknown): number | undefined {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
}
