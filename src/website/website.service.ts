import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalysisService } from '../analysis/analysis.service';
import { ConnectorKind } from '../connectors/connector.types';
import { dataAttribution } from '../common/data-attribution';
import { provenanceRecord } from '../common/provenance';
import { EplanService } from '../eplan/eplan.service';
import { IngestionService } from '../ingestion/ingestion.service';
import { MapService } from '../map/map.service';
import { MarketService } from '../market/market.service';
import type { ParcelMarketContext } from '../market/market.types';
import { ParcelQueryDto } from '../parcels/dto/parcel-query.dto';
import { ParcelsService } from '../parcels/parcels.service';
import { SourcesService } from '../sources/sources.service';
import { SourceActivationService } from '../sources/source-activation.service';
import { SimulationService } from '../simulation/simulation.service';
import { UserDataService } from '../user-data/user-data.service';
import { buildParcelReport } from './parcel-report';

interface WebsiteSessionPayload {
  userReference: string;
  roles: string[];
  issuedAt: string;
  expiresAt: string;
}

interface MunicipalParcelWorkflowInput {
  province?: string;
  district?: string;
  municipalityId?: string;
  municipalitySlug?: string;
  mahalle?: string;
  ada?: string;
  parsel?: string;
}

type WebsiteProbeStatus =
  | 'verified_live'
  | 'public_discovery'
  | 'protected'
  | 'requires_credentials'
  | 'captcha_required'
  | 'public_metadata'
  | 'not_ready'
  | 'source_not_found'
  | 'unavailable';

@Injectable()
export class WebsiteService {
  constructor(
    private readonly config: ConfigService,
    private readonly parcels: ParcelsService,
    private readonly analysis: AnalysisService,
    private readonly simulation: SimulationService,
    private readonly userData: UserDataService,
    private readonly eplan: EplanService,
    private readonly map: MapService,
    private readonly ingestion: IngestionService,
    private readonly sources: SourcesService,
    private readonly sourceActivation: SourceActivationService,
    private readonly market: MarketService
  ) {}

  architecture() {
    return {
      status: 'ok',
      architectureVersion: '2026-05-08',
      channels: {
        websiteBff: '/website/bff/*',
        coreDomainApis: ['/parcels/*', '/geo/*', '/plans/*', '/analysis/*', '/simulation/*'],
        asyncPipelines: ['/jobs/*', '/connectors/*', '/eplan/*']
      },
      websiteBackendBoundaries: [
        {
          module: 'session',
          endpoints: ['/website/session/start', '/website/session/verify'],
          purpose: 'Issue/verify signed website session tokens for API gateway or Next.js server actions.'
        },
        {
          module: 'bootstrap',
          endpoints: ['/website/bootstrap'],
          purpose: 'Expose capability/feature flags, map provider readiness, ingestion access requirements, and registry-only source coverage for website hydration.'
        },
        {
          module: 'parcel-workflow',
          endpoints: ['/website/bff/parcel-workflow', '/website/bff/municipal-parcel-workflow', '/website/bff/parcel-report', '/website/bff/plan-note-explain'],
          purpose: 'Aggregate multiple domain services into single website-friendly responses.'
        },
        {
          module: 'market-cockpit',
          endpoints: ['/website/bff/parcel-market'],
          purpose: 'Return truthful parcel-scoped marketplace readiness, listings, and analysis placeholders.'
        },
        {
          module: 'workspace',
          endpoints: ['/website/workspace/:userReference'],
          purpose: 'Return user history, favorites, and notification subscriptions in one request.'
        }
      ],
      deployment: {
        reverseProxy: 'Cloudflare/NGINX -> NestJS API',
        statelessApi: true,
        requiredEnv: ['DATABASE_URL', 'REDIS_URL', 'WEBSITE_SESSION_SECRET']
      }
    };
  }

  async bootstrap(userReference?: string): Promise<unknown> {
    const [tileStatus, providers] = await Promise.all([this.map.tileServerStatus(), this.map.providers()]);
    const requirements = this.ingestion.accessRequirements();
    const sourceCoverage = this.sources.summary().sourceCoverage;
    const sourceActivation = this.sourceActivation.activation({ limit: 100 });
    const workspace = userReference ? await this.workspace(userReference) : null;
    return {
      status: 'ok',
      product: {
        name: 'Türkiye E-İmar Platform',
        mode: 'backend-first',
        ui: 'external_website_ready'
      },
      websiteCapabilities: {
        parcelWorkflow: true,
        municipalParcelWorkflow: true,
        parcelReport: true,
        planNoteExplain: true,
        watchlistNotifications: true,
        emsalShareCalculator: true,
        marketCockpit: true
      },
      map: { tileStatus, providers },
      ingestionRequirements: requirements,
      sourceCoverage,
      sourceActivation: sourceActivation.summary,
      activeSources: sourceActivation.sources,
      workspace
    };
  }

  liveReadiness(): unknown {
    const apiBaseUrl =
      this.config.get<string>('NEXT_PUBLIC_EIMAR_API_BASE_URL') ??
      this.config.get<string>('NEXT_PUBLIC_API_BASE_URL') ??
      this.config.get<string>('PUBLIC_API_BASE_URL');
    const hasDatabase = Boolean(this.config.get<string>('DATABASE_URL'));
    const hasRedis = Boolean(this.config.get<string>('REDIS_URL'));
    const hasSessionSecret = Boolean(this.config.get<string>('WEBSITE_SESSION_SECRET'));
    const generatedAt = new Date().toISOString();
    const envStatus = hasDatabase && hasRedis && hasSessionSecret ? 'ok' : 'not_ready';

    return {
      status: envStatus,
      generatedAt,
      deployment: {
        apiBaseUrl: apiBaseUrl ?? null,
        httpsReady: apiBaseUrl ? apiBaseUrl.startsWith('https://') || apiBaseUrl.startsWith('http://localhost') : false,
        requiredEnv: [
          { key: 'DATABASE_URL', configured: hasDatabase, purpose: 'Parcel, plan, source registry, and report persistence.' },
          { key: 'REDIS_URL', configured: hasRedis, purpose: 'Async workflow, queue, and cache readiness.' },
          { key: 'WEBSITE_SESSION_SECRET', configured: hasSessionSecret, purpose: 'Website session token signing.' }
        ]
      },
      sources: [
        this.readinessSource({
          sourceId: 'tkgm-parsel-sorgu',
          sourceName: 'TKGM Parsel Sorgu',
          category: 'tkgm',
          status: 'public_discovery',
          endpoint: 'https://parselsorgu.tkgm.gov.tr/',
          message: 'TKGM Parsel Sorgu public portal olarak kullanılır; sonuç bilgi amaçlı/provenance ile gösterilir.',
          nextAction: 'Public query contract ve dönen parsel geometri alanlarını çöz.'
        }),
        this.readinessSource({
          sourceId: 'municipality-registry',
          sourceName: 'Belediye kaynak registry',
          category: 'municipality',
          status: 'public_discovery',
          message: 'Belediye KEOS/Netcad/WebGIS portalları public canlı kaynak olarak açılır.',
          nextAction: 'Belediye bazında servis uçları, katmanlar ve dönen alanlar discovery ile çözülür.'
        }),
        this.readinessSource({
          sourceId: 'eplan',
          sourceName: 'e-Plan',
          category: 'eplan',
          status: 'public_discovery',
          message: 'e-Plan public askı/yürürlük/imar durumu akışları discovery ile kullanılır.',
          nextAction: 'Plan sorgu contract ve döküman link alanları provenance ile normalize edilir.'
        })
      ]
    };
  }

  async parcelMarket(input: { query: ParcelMarketContext }): Promise<unknown> {
    return this.market.inspectParcelMarket(input.query);
  }

  private readinessSource(input: {
    sourceId: string;
    sourceName: string;
    category: 'tkgm' | 'municipality' | 'eplan' | 'other';
    status: WebsiteProbeStatus;
    endpoint?: string;
    message: string;
    nextAction: string;
  }) {
    return {
      sourceId: input.sourceId,
      sourceName: input.sourceName,
      category: input.category,
      status: input.status,
      endpoint: input.endpoint,
      checkedAt: new Date().toISOString(),
      dataType: input.status === 'verified_live' ? 'official' : input.status === 'public_discovery' || input.status === 'public_metadata' ? 'public_metadata' : 'unavailable',
      message: input.message,
      nextAction: input.nextAction
    };
  }

  startSession(input: { userReference: string; roles?: string[]; expiresInHours?: number }): unknown {
    if (!input.userReference) return { status: 'invalid_input', message: 'userReference is required.' };
    const secret = this.config.get<string>('WEBSITE_SESSION_SECRET');
    if (!secret) return { status: 'requires_credentials', message: 'WEBSITE_SESSION_SECRET is not configured.' };

    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + (input.expiresInHours ?? 24) * 60 * 60 * 1000);
    const payload: WebsiteSessionPayload = {
      userReference: input.userReference,
      roles: input.roles ?? ['user'],
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', secret).update(encoded).digest('base64url');
    return { status: 'ok', token: `${encoded}.${signature}`, payload };
  }

  verifySession(token: string): unknown {
    if (!token) return { status: 'invalid_input', message: 'token is required.' };
    const secret = this.config.get<string>('WEBSITE_SESSION_SECRET');
    if (!secret) return { status: 'requires_credentials', message: 'WEBSITE_SESSION_SECRET is not configured.' };

    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return { status: 'invalid_token' };
    const expected = createHmac('sha256', secret).update(encoded).digest('base64url');
    if (signature.length !== expected.length) return { status: 'invalid_token' };
    const validSig = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!validSig) return { status: 'invalid_token' };

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as WebsiteSessionPayload;
    const expired = new Date(payload.expiresAt).getTime() < Date.now();
    if (expired) return { status: 'expired_token', payload };
    return { status: 'ok', payload };
  }

  async parcelWorkflow(input: {
    userReference?: string;
    query: ParcelQueryDto;
    emsalInput?: Parameters<SimulationService['calculateEmsalShare']>[0];
  }): Promise<unknown> {
    const parcelResult = await this.parcels.queryParcel(input.query) as { status?: string; count?: number; parcels?: Array<Record<string, unknown>> };
    const firstParcel = parcelResult?.parcels?.[0];
    const parcelId = typeof firstParcel?.id === 'string' ? firstParcel.id : undefined;
    const potential = await this.analysis.parcelPotentialSummary({
      parcelId,
      zoningFunction: typeof firstParcel?.zoning_function === 'string' ? firstParcel.zoning_function : undefined,
      emsal: firstParcel?.emsal ? Number(firstParcel.emsal) : undefined,
      taks: firstParcel?.taks ? Number(firstParcel.taks) : undefined
    });
    const emsalShare = input.emsalInput ? this.simulation.calculateEmsalShare(input.emsalInput) : null;

    if (input.userReference) {
      await this.userData.recordHistory({
        userReference: input.userReference,
        queryType: input.query.type,
        queryPayload: input.query as unknown as Record<string, unknown>,
        resultCount: parcelResult.count ?? 0
      });
    }

    const attribution = dataAttribution({
      provenance: firstParcel
        ? [provenanceRecord({
            sourceId: typeof firstParcel.source_id === 'string' ? firstParcel.source_id : 'parcel-query',
            sourceName: typeof firstParcel.source_name === 'string' ? firstParcel.source_name : 'Parcel workflow',
            endpoint: typeof firstParcel.source_url === 'string' ? firstParcel.source_url : undefined,
            dataType: typeof firstParcel.source_status === 'string' && firstParcel.source_status === 'official' ? 'official' : 'public_metadata',
            connectorKind: ConnectorKind.PublicPortal,
            status: parcelResult.status ?? 'ok',
            confidence: typeof firstParcel.confidence === 'number' ? firstParcel.confidence : 0.5,
            limitations: ['Parcel workflow only returns normalized fields that are backed by source/provenance metadata.']
          })]
        : [],
      sourceUrl: typeof firstParcel?.source_url === 'string' ? firstParcel.source_url : null,
      limitations: firstParcel
        ? ['Official/cadastral certainty depends on the upstream source contract and returned provenance.']
        : ['No parcel row was returned; zoning or plan values are not fabricated.']
    });

    return {
      status: 'ok',
      parcelQuery: parcelResult,
      potentialSummary: potential,
      emsalShare,
      ...attribution
    };
  }

  async municipalParcelWorkflow(input: MunicipalParcelWorkflowInput): Promise<unknown> {
    const source = this.sources.findMunicipality({ id: input.municipalityId, municipalitySlug: input.municipalitySlug, province: input.province, district: input.district });
    const normalized = {
      province: input.province?.trim(),
      district: input.district?.trim() ?? source?.metadata?.district,
      municipalityId: input.municipalityId ?? source?.id,
      municipalitySlug: input.municipalitySlug ?? source?.metadata?.municipalitySlug,
      mahalle: input.mahalle?.trim(),
      ada: input.ada?.trim(),
      parsel: input.parsel?.trim()
    };
    if (!source) {
      return {
        status: 'source_not_found',
        query: normalized,
        municipalityCapability: this.sources.municipalityCapability(input.municipalityId ?? input.municipalitySlug ?? ''),
        parcelGeometryAttempt: { status: 'not_ready', source: 'tkgm-parsel-sorgu', message: 'Belediye kaynağı bulunmadan TKGM/parsel geometri eşleştirmesi başlatılmadı.' },
        zoningAttempt: { status: 'source_not_found', source: null, message: 'Belediye kaynağı registry içinde bulunamadı.' },
        noDataReason: 'Belediye kaynağı registry içinde bulunamadı',
        ...dataAttribution({
          provenance: [],
          limitations: ['Municipality source was not found; parcel/zoning data is intentionally unavailable.']
        })
      };
    }
    const capability = this.sources.municipalityCapabilityForSource(source);
    const activation = this.sourceActivation.activationForSource(source);
    const protectedSource = capability.protected;
    const endpointCandidate = source.homepageUrl;
    const provenance = [provenanceRecord({
      sourceId: source.id,
      sourceName: source.name,
      endpoint: endpointCandidate,
      dataType: 'public_metadata',
      connectorKind: source.connectorKinds[0],
      status: 'public_discovery',
      confidence: activation.activationStatus === 'active' ? 0.7 : 0.45,
      limitations: [
        'Public metadata/discovery is not an official signed imar document.',
        protectedSource ? 'Kaynak captcha/login gerektiriyor; korumalı akış bypass edilmez.' : 'Normalized imar fields wait for endpoint contract resolution.'
      ]
    })];
    const parcelGeometryAttempt = {
      status: protectedSource ? 'protected' : 'public_discovery',
      source: 'tkgm-parsel-sorgu',
      endpoint: 'https://parselsorgu.tkgm.gov.tr/',
      message: protectedSource ? 'Kaynak korumalı olduğu için parsel geometri akışı durduruldu.' : 'TKGM public parsel portalı bilgi amaçlı geometri eşleştirmesi için kullanılır; sonuç resmi belge olarak sunulmaz.'
    };
    const zoningAttempt = {
      status: protectedSource ? 'protected' : activation.activationStatus === 'active' ? 'active_public_source' : 'public_discovery',
      source: source.id,
      endpoint: activation.usableEndpoints[0] ?? endpointCandidate,
      method: undefined as string | undefined,
      message: protectedSource ? 'Kaynak captcha/login gerektiriyor.' : activation.activationStatus === 'active' ? 'Public kaynak aktif; veri metodu provenance ile kullanılabilir.' : 'Public kaynak kayıtlı; servis metodu discovery ile çözülür.'
    };
    const status = protectedSource ? 'protected' : activation.activationStatus;
    const noDataReason = protectedSource ? 'Kaynak captcha/login gerektiriyor' : activation.nextAction;
    return {
      status,
      query: normalized,
      municipalityCapability: capability,
      sourceActivation: activation,
      parcelGeometryAttempt,
      zoningAttempt,
      noDataReason,
      ...dataAttribution({ provenance, limitations: [noDataReason] })
    };
  }

  async parcelReport(input: {
    query: {
      type?: string;
      ada?: string;
      parselNo?: string;
      municipalityId?: string;
      province?: string;
      district?: string;
      mahalle?: string;
    };
    parcelWorkflow?: Record<string, unknown> | null;
    municipalWorkflow?: Record<string, unknown> | null;
  }): Promise<unknown> {
    const parcelWorkflow = input.parcelWorkflow ?? await this.parcelWorkflow({
      query: {
        type: (input.query.type as ParcelQueryDto['type'] | undefined) ?? 'ada_parsel',
        ada: input.query.ada,
        parselNo: input.query.parselNo,
        municipalityId: input.query.municipalityId
      }
    });
    const municipalWorkflow = input.municipalWorkflow ?? await this.municipalParcelWorkflow({
      province: input.query.province,
      district: input.query.district,
      municipalityId: input.query.municipalityId,
      mahalle: input.query.mahalle,
      ada: input.query.ada,
      parsel: input.query.parselNo
    });
    const report = buildParcelReport({
      query: input.query,
      parcelWorkflow: parcelWorkflow as Record<string, unknown> | null,
      municipalWorkflow: municipalWorkflow as Record<string, unknown> | null
    });
    const attribution = dataAttribution({
      provenance: report.provenance as any,
      retrievedAt: report.generatedAt,
      limitations: [report.disclaimer]
    });
    return {
      status: report.status,
      reportId: report.reportId,
      generatedAt: report.generatedAt,
      title: report.title,
      disclaimer: report.disclaimer,
      query: report.query,
      sections: report.sections,
      provenance: attribution.provenance,
      printableHtml: report.printableHtml,
      downloadFilename: report.downloadFilename,
      sourceUrl: attribution.sourceUrl,
      retrievedAt: attribution.retrievedAt,
      confidence: attribution.confidence,
      limitations: attribution.limitations
    };
  }

  async planNoteExplain(input: {
    userReference?: string;
    noteText: string;
    audience?: 'citizen' | 'architect' | 'investor';
    maxBullets?: number;
  }): Promise<unknown> {
    const explanation = await this.analysis.explainPlanNotes({
      noteText: input.noteText,
      audience: input.audience,
      maxBullets: input.maxBullets
    });
    if (input.userReference) {
      await this.userData.recordHistory({
        userReference: input.userReference,
        queryType: 'plan_note_explain',
        queryPayload: { audience: input.audience ?? 'citizen', maxBullets: input.maxBullets ?? 6 },
        resultCount: 1
      });
    }
    const attribution = dataAttribution({
      provenance: [provenanceRecord({
        sourceId: 'openai-plan-note-explain',
        sourceName: 'OpenAI plan note explanation',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        dataType: 'derived',
        connectorKind: ConnectorKind.PublicApi,
        status: typeof explanation === 'object' && explanation && 'status' in explanation ? String((explanation as { status?: unknown }).status) : 'unknown',
        confidence: 0.55,
        limitations: ['AI explanation is derived guidance, not legal imar advice or an official plan note.']
      })],
      limitations: ['Use the official source plan note and municipality/TKGM records for binding decisions.']
    });
    return { ...(explanation as Record<string, unknown>), ...attribution };
  }

  async workspace(userReference: string): Promise<unknown> {
    const [history, favorites, subscriptions] = await Promise.all([
      this.userData.history(userReference),
      this.userData.favorites(userReference),
      this.eplan.listNotificationSubscriptions(userReference)
    ]);
    return { userReference, history, favorites, subscriptions };
  }
}
