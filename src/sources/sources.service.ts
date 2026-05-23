import { Injectable, NotFoundException } from '@nestjs/common';
import { ConnectorKind } from '../connectors/connector.types';
import { SOURCE_REGISTRY, SourceAccessStatus, SourceRegistryEntry, sourcePublicReadinessStatus } from './source-registry';
import { isProtectedSource, isPublicCandidateSource, summarizeSources, toMunicipalitySummary } from './source-coverage';

export type ImarQuerySupport = 'supported' | 'source_unavailable' | 'protected' | 'unknown';
export type ParcelGeometrySupport = 'supported' | 'protected' | 'unknown';

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

@Injectable()
export class SourcesService {
  list() {
    return {
      status: 'ok',
      count: SOURCE_REGISTRY.length,
      readinessStatuses: ['verified_live', 'public_metadata', 'captcha_required', 'requires_credentials', 'requires_legal_agreement', 'unavailable'],
      sources: SOURCE_REGISTRY.map((source) => ({ ...source, publicReadiness: { status: sourcePublicReadinessStatus(source), message: source.access.notes } }))
    };
  }

  summary() {
    return { status: 'ok', sourceCoverage: summarizeSources(SOURCE_REGISTRY) };
  }

  municipalities(filters: { province?: string; district?: string; vendor?: string; accessStatus?: SourceAccessStatus }) {
    const normalizedProvince = this.normalize(filters.province);
    const normalizedDistrict = this.normalize(filters.district);
    const normalizedVendor = this.normalize(filters.vendor);
    const matchedSources = SOURCE_REGISTRY.filter((source) => {
      if (source.jurisdiction !== 'municipal') return false;
      if (normalizedProvince && this.normalize(source.metadata?.province) !== normalizedProvince) return false;
      if (normalizedDistrict && this.normalize(source.metadata?.district) !== normalizedDistrict) return false;
      if (normalizedVendor && this.normalize(source.metadata?.vendor) !== normalizedVendor) return false;
      if (filters.accessStatus && source.access.status !== filters.accessStatus) return false;
      return true;
    });
    const municipalities = matchedSources.map((source) => ({ ...toMunicipalitySummary(source), capability: this.municipalityCapabilityForSource(source) }));
    const sourceCoverage = summarizeSources(matchedSources);

    return { status: 'ok', count: municipalities.length, municipalities, sourceCoverage, summary: sourceCoverage };
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
        nextAction: 'Public portal URL’sini kaynak katkı/import önizlemesiyle ekleyin.'
      };
    }
    return this.municipalityCapabilityForSource(source);
  }

  normalizeCandidate(input: { url: string; name?: string; province?: string; district?: string; probe?: boolean }) {
    const normalizedUrl = this.normalizeUrl(input.url);
    if (!normalizedUrl) return { status: 'invalid_input', message: 'Geçerli bir http/https URL gereklidir.' };
    const vendor = this.guessVendor(normalizedUrl);
    const municipalitySlug = this.guessMunicipalitySlug(normalizedUrl, input.name, input.district);
    const sourceId = `${municipalitySlug || 'unknown'}-${vendor === 'unknown' ? 'municipal' : vendor}`;
    const connectorKinds = vendor === 'netcad'
      ? [ConnectorKind.NetcadKeos, ConnectorKind.Keos, ConnectorKind.Wms, ConnectorKind.Wfs]
      : vendor === 'webgis'
        ? [ConnectorKind.Webgis, ConnectorKind.Ogc, ConnectorKind.Wms, ConnectorKind.Wfs]
        : vendor === 'ekent'
          ? [ConnectorKind.Ekent, ConnectorKind.MunicipalPortal]
          : [ConnectorKind.MunicipalPortal];
    const capabilities = vendor === 'netcad' || vendor === 'webgis'
      ? ['zoning_status', 'municipal_gis', 'netcad_keos', 'parcel_lookup', 'plan_lookup']
      : ['zoning_status', 'municipal_gis', 'parcel_lookup'];
    const accessStatusGuess = this.guessAccessStatus(normalizedUrl, vendor);
    const accessStatusReason = accessStatusGuess === 'requires_credentials'
      ? 'URL içinde açık kimlik doğrulama/protected erişim işareti görüldü; canlı doğrulama yine gereklidir.'
      : accessStatusGuess === 'public_metadata'
        ? 'URL daha çok dokümantasyon / metadata benzeri görünüyor; canlı veri erişimi doğrulanmadı.'
        : 'Public portal olarak önizlenir; canlı probe servis uçlarını ve alan kontratını ayrıca çözer.';
    const wouldRegister = {
      id: sourceId,
      name: input.name || `${input.district || municipalitySlug || 'Belediye'} imar kaynağı`,
      jurisdiction: 'municipal',
      category: 'municipal_gis',
      homepageUrl: normalizedUrl,
      connectorKinds,
      access: { status: 'public', notes: 'User-submitted public portal preview. Live probe resolves endpoint contract and stops on login/captcha/protected flows.' },
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
      accessStatusGuess,
      accessStatusReason,
      connectorKinds,
      capabilities,
      wouldRegister,
      probeCandidates,
      note: 'Registry otomatik güncellenmez; public portal discovery captcha/login/kapalı endpoint görürse otomatik çağrı yapmaz.'
    };
  }

  municipalityCapabilityForSource(source: SourceRegistryEntry): MunicipalityCapability {
    const protectedSource = isProtectedSource(source);
    const publicCandidate = isPublicCandidateSource(source);
    const hasZoning = source.capabilities.includes('zoning_status');
    const hasMunicipalPortal = source.connectorKinds.some((kind) => [ConnectorKind.NetcadKeos, ConnectorKind.Keos, ConnectorKind.Webgis, ConnectorKind.Ekent, ConnectorKind.MunicipalPortal, ConnectorKind.PublicPortal, ConnectorKind.Ogc, ConnectorKind.Wms, ConnectorKind.Wfs, ConnectorKind.Geoserver, ConnectorKind.ArcgisRest].includes(kind));
    const imarQuerySupport: ImarQuerySupport = protectedSource
      ? 'protected'
      : !publicCandidate
        ? 'source_unavailable'
        : hasZoning && hasMunicipalPortal
          ? 'supported'
          : 'unknown';
    const parcelGeometrySupport: ParcelGeometrySupport = protectedSource ? 'protected' : publicCandidate ? 'supported' : 'unknown';
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
        : imarQuerySupport === 'supported'
          ? 'Public belediye portalı kayıtlı; endpoint/provenance keşfiyle bilgi amaçlı imar alanları gösterilir'
          : 'Kaynak kayıtlı; public health/discovery probe servis uçlarını doğrular',
      nextAction: protectedSource
        ? 'Otomatik keşfi durdurun; onaylı erişim veya resmi izin gereklidir.'
        : imarQuerySupport === 'supported'
          ? 'Public portalı aç, Netcad/KEOS/OGC servis uçlarını keşfet ve dönen alanları provenance ile normalize et.'
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

  private guessAccessStatus(url: string, vendor: 'netcad' | 'ekent' | 'webgis' | 'kbs' | 'municipal' | 'unknown'): 'public_metadata' | 'requires_credentials' | 'unknown' {
    const value = url.toLocaleLowerCase('tr-TR');
    if (/(login|giris|auth|captcha|sso|e-devlet|uygulama|uye)/i.test(value)) return 'requires_credentials';
    if (/(docs?|wiki|api|help|manual|reference|swagger)/i.test(value)) return 'public_metadata';
    if (vendor === 'municipal' && /\b(keos|webgis|imar|imardurumu|kbs)\b/.test(value)) return 'unknown';
    return 'unknown';
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
