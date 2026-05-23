import { Controller, Get, Query } from '@nestjs/common';
import { EplanService } from '../eplan/eplan.service';

type PlanSearchEnvelope = {
  status?: string;
  plans?: Array<Record<string, unknown>>;
  count?: number;
  issue?: { message?: string };
};

@Controller(['plans', 'api/v1/plans'])
export class PlansCompatController {
  constructor(private readonly eplan: EplanService) {}

  @Get()
  async plans(
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('status') status?: string,
    @Query('planType') planType?: string,
    @Query('limit') limit?: string
  ) {
    const response = await this.search({ province, district, status, planType, limit });
    return this.toPlanItems(response.plans ?? []);
  }

  @Get('aski')
  async askiPlans(
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('limit') limit?: string
  ) {
    const response = await this.search({ province, district, status: 'askida', limit });
    return this.toPlanItems(response.plans ?? [], 'askida');
  }

  @Get('latest-regions')
  async latestRegions(
    @Query('limit') limit?: string,
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('municipality_slug') municipalitySlug?: string,
    @Query('has_geometry') hasGeometry?: string
  ) {
    const response = await this.search({ province, district, limit });
    let items = this.toLatestRegionItems(response.plans ?? [], municipalitySlug);
    if (hasGeometry === 'true') items = items.filter((item) => item.has_geometry);
    if (hasGeometry === 'false') items = items.filter((item) => !item.has_geometry);
    const geometryCount = items.filter((item) => item.has_geometry).length;

    return {
      items,
      total: items.length,
      geometry_count: geometryCount,
      status: items.length > 0 ? 'public_metadata' : 'not_ready',
      message: items.length > 0
        ? 'e-Plan metadata records normalized for latest-region UI; geometry still depends on PostGIS/GML ingestion.'
        : response.issue?.message ?? 'Canlı plan/geometri tablosu hazır değil; latest-regions compatibility response boş döndü.'
    };
  }

  private async search(input: {
    province?: string;
    district?: string;
    status?: string;
    planType?: string;
    limit?: string;
  }): Promise<PlanSearchEnvelope> {
    return this.eplan.searchPlans({
      province: input.province,
      district: input.district,
      status: input.status,
      planType: input.planType,
      limit: this.parseLimit(input.limit)
    }) as Promise<PlanSearchEnvelope>;
  }

  private toPlanItems(plans: Array<Record<string, unknown>>, fallbackStatus?: string) {
    return plans.map((plan) => ({
      id: this.numericId(plan.id ?? plan.plan_external_id ?? plan.title),
      municipality_id: this.numericIdOrUndefined(plan.municipality_id),
      plan_type: this.stringValue(plan.plan_type ?? plan.planType),
      status: this.stringValue(plan.status) ?? fallbackStatus ?? 'public_metadata',
      aski_start: this.stringValue(plan.aski_start ?? plan.aski_start_date),
      aski_end: this.stringValue(plan.aski_end ?? plan.aski_end_date),
      pdf_url: this.stringValue(plan.pdf_url),
      gml_url: this.stringValue(plan.gml_url),
      geom_geojson: plan.geom_geojson ?? plan.geometry ?? undefined
    }));
  }

  private toLatestRegionItems(plans: Array<Record<string, unknown>>, municipalitySlug?: string) {
    return plans.map((plan) => {
      const geometry = plan.geom_geojson ?? plan.geometry ?? null;
      const title = this.stringValue(plan.title) ?? this.stringValue(plan.plan_external_id) ?? 'İmar planı kaydı';
      return {
        id: this.numericId(plan.id ?? plan.plan_external_id ?? title),
        label: title,
        municipality_id: this.numericIdOrUndefined(plan.municipality_id),
        municipality_name: this.stringValue(plan.municipality_name) ?? null,
        municipality_slug: municipalitySlug ?? this.slugify(this.stringValue(plan.district) ?? this.stringValue(plan.province) ?? title),
        province: this.stringValue(plan.province) ?? null,
        district: this.stringValue(plan.district) ?? null,
        plan_type: this.stringValue(plan.plan_type ?? plan.planType) ?? null,
        status: this.stringValue(plan.status) ?? 'public_metadata',
        aski_start: this.stringValue(plan.aski_start ?? plan.aski_start_date) ?? null,
        aski_end: this.stringValue(plan.aski_end ?? plan.aski_end_date) ?? null,
        pdf_url: this.stringValue(plan.pdf_url) ?? null,
        gml_url: this.stringValue(plan.gml_url) ?? null,
        source: 'public_metadata',
        has_geometry: Boolean(geometry),
        geom_geojson: geometry
      };
    });
  }

  private parseLimit(limit?: string): number {
    const parsed = Number(limit);
    return Number.isFinite(parsed) ? Math.max(1, Math.min(100, Math.trunc(parsed))) : 20;
  }

  private numericId(value: unknown): number {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return Math.trunc(numeric);
    let hash = 0;
    for (const char of String(value ?? 'plan')) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    return Math.abs(hash);
  }

  private numericIdOrUndefined(value: unknown): number | undefined {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.trunc(numeric) : undefined;
  }

  private stringValue(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private slugify(value: string): string {
    return value.toLocaleLowerCase('tr-TR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'unknown';
  }
}

@Controller(['aski', 'api/v1/aski'])
export class AskiCompatController {
  constructor(private readonly eplan: EplanService) {}

  @Get('active')
  async active(@Query('province') province?: string, @Query('district') district?: string, @Query('limit') limit?: string) {
    const response = await this.search({ province, district, status: 'askida', limit });
    const notices = (response.plans ?? []).map((plan) => {
      const title = this.stringValue(plan.title) ?? this.stringValue(plan.plan_external_id) ?? 'Askıdaki plan kaydı';
      return {
        id: String(plan.id ?? plan.plan_external_id ?? title),
        title,
        document_url: this.stringValue(plan.pdf_url) ?? this.stringValue(plan.gml_url),
        source_id: 'csb-e-plan',
        province: this.stringValue(plan.province) ?? null,
        district: this.stringValue(plan.district) ?? null,
        aski_start: this.stringValue(plan.aski_start ?? plan.aski_start_date) ?? null,
        aski_end: this.stringValue(plan.aski_end ?? plan.aski_end_date) ?? null,
        status: this.stringValue(plan.status) ?? 'public_metadata'
      };
    });

    return {
      status: notices.length > 0 ? 'ok' : 'not_ready',
      message: notices.length > 0
        ? 'e-Plan askı metadata kayıtları normalize edildi; resmi belge yerine kaynak bağlantısı gösterilir.'
        : response.issue?.message ?? 'Askı kayıtları için e-Plan/PostGIS veri seti hazır değil.',
      count: notices.length,
      notices,
      sources: [{
        source_id: 'csb-e-plan',
        name: 'ÇŞİDB E-Plan Güncel',
        status: notices.length > 0 ? 'public_metadata' : 'not_ready',
        message: 'Compatibility facade; canlı askı/plan doğrulaması e-Plan ingestion tamamlandığında kesinleşir.'
      }],
      total_sources: 1,
      ok_sources: notices.length > 0 ? 1 : 0,
      fetched_at: new Date().toISOString()
    };
  }

  @Get('active/geojson')
  async activeGeojson(@Query('province') province?: string, @Query('district') district?: string, @Query('limit') limit?: string) {
    const response = await this.search({ province, district, status: 'askida', limit });
    const features = (response.plans ?? [])
      .map((plan) => this.toFeature(plan))
      .filter((feature): feature is GeoJSON.Feature => feature !== null);

    return {
      type: 'FeatureCollection',
      status: features.length > 0 ? 'public_metadata' : 'not_ready',
      count: features.length,
      features,
      sources: [{
        source_id: 'csb-e-plan',
        status: features.length > 0 ? 'public_metadata' : 'not_ready'
      }],
      fetched_at: new Date().toISOString()
    };
  }

  private async search(input: {
    province?: string;
    district?: string;
    status?: string;
    limit?: string;
  }): Promise<PlanSearchEnvelope> {
    return this.eplan.searchPlans({
      province: input.province,
      district: input.district,
      status: input.status,
      limit: this.parseLimit(input.limit)
    }) as Promise<PlanSearchEnvelope>;
  }

  private toFeature(plan: Record<string, unknown>): GeoJSON.Feature | null {
    const geometry = plan.geom_geojson ?? plan.geometry;
    if (!geometry || typeof geometry !== 'object') return null;
    return {
      type: 'Feature',
      id: String(plan.id ?? plan.plan_external_id ?? 'aski'),
      properties: {
        title: this.stringValue(plan.title) ?? 'Askıdaki plan kaydı',
        source_id: 'csb-e-plan',
        status: this.stringValue(plan.status) ?? 'public_metadata',
        document_url: this.stringValue(plan.pdf_url) ?? null
      },
      geometry: geometry as GeoJSON.Geometry
    };
  }

  private parseLimit(limit?: string): number {
    const parsed = Number(limit);
    return Number.isFinite(parsed) ? Math.max(1, Math.min(100, Math.trunc(parsed))) : 20;
  }

  private stringValue(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }
}
