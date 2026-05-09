import { Injectable, NotFoundException } from '@nestjs/common';
import { ConnectorKind } from '../connectors/connector.types';
import { SOURCE_REGISTRY, SourceAccessStatus, SourceRegistryEntry } from './source-registry';
import { isProtectedSource, isPublicCandidateSource, summarizeSources, toMunicipalitySummary } from './source-coverage';

export type ImarQuerySupport = 'supported' | 'method_contract_required' | 'source_unavailable' | 'protected' | 'unknown';
export type ParcelGeometrySupport = 'tkgm_candidate' | 'supported' | 'protected' | 'unknown';

export interface MunicipalityCapability {
  source: {
    id: string;
    name: string;
    homepageUrl: string;
    province?: string;
    district?: string;
    municipalitySlug?: string;
    vendor?: string;
    accessStatus: SourceAccessStatus;
    accessNotes: string;
    connectorKinds: ConnectorKind[];
    capabilities: string[];
  } | null;
  registered: boolean;
  publicCandidate: boolean;
  protected: boolean;
  lastHealth: null;
  imarQuerySupport: ImarQuerySupport;
  parcelGeometrySupport: ParcelGeometrySupport;
  reasonNoData: string;
  nextAction: string;
}

export interface SourceCandidateNormalizationPreview {
  status: 'ok' | 'invalid_input';
  message?: string;
  normalizedUrl?: string;
  vendor?: 'netcad' | 'ekent' | 'webgis' | 'kbs' | 'municipal' | 'unknown';
  municipalitySlug?: string;
  sourceIdCandidate?: string;
  connectorKinds?: ConnectorKind[];
  capabilities?: string[];
  accessStatusGuess?: SourceAccessStatus;
  accessStatusReason?: string;
  wouldRegister?: {
    id: string;
    name: string;
    jurisdiction: 'municipal';
    category: 'municipal_gis';
    homepageUrl: string;
    connectorKinds: ConnectorKind[];
    access: { status: SourceAccessStatus; notes: string };
    capabilities: string[];
    metadata: { province?: string; district?: string; municipalitySlug?: string; vendor?: string };
  };
  probeCandidates?: string[];
  note?: string;
}

@Injectable()
export class SourcesService {
  list() {
    return { status: 'ok', count: SOURCE_REGISTRY.length, sources: SOURCE_REGISTRY };
  }

  summary() {
    return { status: 'ok', sourceCoverage: summarizeSources(SOURCE_REGISTRY) };
  }

  municipalities(filters: { province?: string; district?: string; vendor?: string; accessStatus?: SourceAccessStatus }) {
    const normalizedProvince = this.normalize(filters.province);
    const normalizedDistrict = this.normalize(filters.district);
    const normalizedVendor = this.normalize(filters.vendor);
    const sources = SOURCE_REGISTRY.filter((source) => {
      if (source.jurisdiction !== 'municipal') return false;
      if (normalizedProvince && this.normalize(source.metadata?.province) !== normalizedProvince) return false;
      if (normalizedDistrict && this.normalize(source.metadata?.district) !== normalizedDistrict) return false;
      if (normalizedVendor && this.normalize(source.metadata?.vendor) !== normalizedVendor) return false;
      if (filters.accessStatus && source.access.status !== filters.accessStatus) return false;
      return true;
    }).map((source) => ({ ...toMunicipalitySummary(source), capability: this.municipalityCapabilityForSource(source) }));

    return { status: 'ok', count: sources.length, municipalities: sources };
  }

  municipalityCoverage(filters: { province?: string; district?: string; vendor?: string; accessStatus?: SourceAccessStatus }) {
    return this.municipalities(filters);
  }

  get(id: string) {
    const source = SOURCE_REGISTRY.find((entry) => entry.id === id);
    if (!source) throw new NotFoundException(`Source '${id}' is not registered.`);
    return source;
  }

  findMunicipality(input: { id?: string; municipalitySlug?: string; province?: string; district?: string }): SourceRegistryEntry | undefined {
    const id = this.normalize(input.id);
    const slug = this.normalize(input.municipalitySlug);
    const province = this.normalize(input.province);
    const district = this.normalize(input.district);
    return SOURCE_REGISTRY.find((entry) => {
      if (entry.jurisdiction !== 'municipal') return false;
      if (id && (this.normalize(entry.id) === id || this.normalize(entry.metadata?.municipalitySlug) === id)) return true;
      if (slug && this.normalize(entry.metadata?.municipalitySlug) === slug) return true;
      if (province && district && this.normalize(entry.metadata?.province) === province && this.normalize(entry.metadata?.district) === district) return true;
      return false;
    });
  }

  municipalityCapability(id: string): MunicipalityCapability {
    const source = this.findMunicipality({ id });
    if (!source) {
      return {
        source: null,
        registered: false,
        publicCandidate: false,
        protected: false,
        lastHealth: null,
        imarQuerySupport: 'unknown',
        parcelGeometrySupport: 'unknown',
        reasonNoData: 'Belediye kaynağı registry içinde bulunamadı',
        nextAction: 'Kaynak katkı/import önizlemesi ile resmi URL ve belediye bilgilerini doğrulayın.'
      };
    }
    return this.municipalityCapabilityForSource(source);
  }

  normalizeCandidate(input: { url: string; name?: string; province?: string; district?: string; probe?: boolean }): SourceCandidateNormalizationPreview {
    const normalizedUrl = this.normalizeUrl(input.url);
    if (!normalizedUrl) return { status: 'invalid_input', message: 'Geçerli bir http/https URL gereklidir.' };
    const vendor = this.guessVendor(normalizedUrl);
    const municipalitySlug = this.guessMunicipalitySlug(normalizedUrl, input.name, input.district);
    const sourceId = `${municipalitySlug || 'unknown'}-${vendor === 'unknown' ? 'municipal' : vendor}-candidate`;
    const accessAssessment = this.guessAccessStatus(normalizedUrl, input.name, input.province, input.district, vendor);
    const connectorKinds = vendor === 'netcad' || vendor === 'webgis'
      ? [ConnectorKind.NetcadKeos, ConnectorKind.MunicipalPortal]
      : vendor === 'ekent'
        ? [ConnectorKind.Ekent, ConnectorKind.MunicipalPortal]
        : [ConnectorKind.MunicipalPortal];
    const capabilities = vendor === 'netcad' || vendor === 'webgis'
      ? ['zoning_status', 'municipal_gis', 'netcad_keos']
      : ['zoning_status', 'municipal_gis'];
    const wouldRegister = {
      id: sourceId,
      name: input.name || `${input.district || municipalitySlug || 'Belediye'} imar kaynağı`,
      jurisdiction: 'municipal' as const,
      category: 'municipal_gis' as const,
      homepageUrl: normalizedUrl,
      connectorKinds,
      access: { status: accessAssessment.status, notes: accessAssessment.reason },
      capabilities,
      metadata: { province: input.province, district: input.district, municipalitySlug, vendor }
    };
    const probeCandidates = input.probe ? this.previewProbeCandidates(normalizedUrl) : [];
    return {
      status: 'ok',
      normalizedUrl,
      vendor,
      municipalitySlug,
      sourceIdCandidate: sourceId,
      connectorKinds,
      capabilities,
      accessStatusGuess: accessAssessment.status,
      accessStatusReason: accessAssessment.reason,
      wouldRegister,
      probeCandidates,
      note: 'Bu sadece bir önizlemedir; registry otomatik güncellenmez ve canlı probe ile doğrulama yapmadan kaynak katkısı oluşturulmaz.'
    };
  }

  municipalityCapabilityForSource(source: SourceRegistryEntry): MunicipalityCapability {
    const protectedSource = isProtectedSource(source);
    const publicCandidate = isPublicCandidateSource(source);
    const hasZoning = source.capabilities.includes('zoning_status');
    const netcadLike = source.connectorKinds.includes(ConnectorKind.NetcadKeos) || source.connectorKinds.includes(ConnectorKind.Ekent);
    const imarQuerySupport: ImarQuerySupport = protectedSource
      ? 'protected'
      : !publicCandidate
        ? 'source_unavailable'
        : hasZoning && netcadLike
          ? 'method_contract_required'
          : 'unknown';
    const parcelGeometrySupport: ParcelGeometrySupport = protectedSource ? 'protected' : 'tkgm_candidate';
    return {
      source: {
        id: source.id,
        name: source.name,
        homepageUrl: source.homepageUrl,
        province: source.metadata?.province,
        district: source.metadata?.district,
        municipalitySlug: source.metadata?.municipalitySlug,
        vendor: source.metadata?.vendor,
        accessStatus: source.access.status,
        accessNotes: source.access.notes,
        connectorKinds: source.connectorKinds,
        capabilities: source.capabilities
      },
      registered: true,
      publicCandidate,
      protected: protectedSource,
      lastHealth: null,
      imarQuerySupport,
      parcelGeometrySupport,
      reasonNoData: protectedSource
        ? 'Kaynak captcha/login veya onaylı erişim gerektiriyor'
        : imarQuerySupport === 'method_contract_required'
          ? 'Endpoint adayı var ancak method contract çözülmedi'
          : 'Kaynak kayıtlı ancak canlı endpoint doğrulanmadı',
      nextAction: protectedSource
        ? 'Otomatik keşfi durdurun; onaylı erişim veya resmi izin gereklidir.'
        : imarQuerySupport === 'method_contract_required'
          ? 'Netcad/KEOS WSDL ve public JavaScript method contract resolver çalıştırılmalı.'
          : 'Public health/discovery probe ile endpoint doğrulanmalı.'
    };
  }

  private normalize(value?: string): string | undefined {
    return value?.trim().toLocaleLowerCase('tr-TR');
  }

  private normalizeUrl(raw: string): string | null {
    try {
      const url = new URL(raw.trim());
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      url.hash = '';
      return url.toString();
    } catch {
      return null;
    }
  }

  private guessVendor(url: string): 'netcad' | 'ekent' | 'webgis' | 'kbs' | 'municipal' | 'unknown' {
    const value = url.toLocaleLowerCase('tr-TR');
    if (value.includes('keos') || value.includes('netgis') || value.includes('netcad')) return 'netcad';
    if (value.includes('ekent')) return 'ekent';
    if (value.includes('webgis')) return 'webgis';
    if (value.includes('kbs')) return 'kbs';
    if (value.includes('bel.tr') || value.includes('belediye')) return 'municipal';
    return 'unknown';
  }

  private guessAccessStatus(
    url: string,
    name?: string,
    province?: string,
    district?: string,
    vendor?: 'netcad' | 'ekent' | 'webgis' | 'kbs' | 'municipal' | 'unknown'
  ): { status: SourceAccessStatus; reason: string } {
    const haystack = [url, name, province, district, vendor].filter(Boolean).join(' ').toLocaleLowerCase('tr-TR');
    if (/(captcha|giri[şs]|login|sign[- ]?in|auth|oauth|otp|member|uyelik|ü yelik|uylik|sso)/i.test(haystack)) {
      return { status: 'requires_credentials', reason: 'URL, ad veya belediye ipucu kimlik doğrulama/protected işaretleri içeriyor.' };
    }
    if (/(kvkk|mevzuat|dokuman|document|docs|swagger|wsdl|api|metadata|catalog|katalog)/i.test(haystack)) {
      return { status: 'public_metadata', reason: 'Görünen ipucu daha çok katalog, dokümantasyon veya metaveri sayfasına benziyor.' };
    }
    if ((/\.bel\.tr|\.gov\.tr/i.test(url) && /(keos|webgis|ekent|kbs|imar|cbs)/i.test(url)) || /(keos|webgis|ekent|kbs|imar|cbs)/i.test(haystack)) {
      return { status: 'public', reason: 'Portal paterni erişilebilir görünüyor; bu yine de canlı doğrulama gerektiren bir tahmindir.' };
    }
    return { status: 'unknown', reason: 'Canlı probe olmadan erişim durumu güvenle doğrulanamıyor.' };
  }

  private guessMunicipalitySlug(url: string, name?: string, district?: string): string {
    const host = new URL(url).hostname.split('.');
    const belIndex = host.indexOf('bel');
    const candidate = district || (belIndex > 0 ? host[belIndex - 1] : host.find((part) => !['www', 'keos', 'webgis', 'kbs', 'ekent', 'imar', 'imardurumu'].includes(part))) || name || 'unknown';
    return candidate.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown';
  }

  private previewProbeCandidates(url: string): string[] {
    const parsed = new URL(url);
    const base = `${parsed.protocol}//${parsed.host}`;
    return [url, new URL('/imardurumu/Services/ImarDurumu.asmx?WSDL', base).toString(), new URL('/geoserver/ows?service=WMS&request=GetCapabilities', base).toString()].slice(0, 3);
  }
}
