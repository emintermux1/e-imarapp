import { ConnectorKind, ProbeStatus } from '../connectors/connector.types';
import { TURKEY_PROVINCES } from './turkey-coverage';
import { SourceAccessStatus, SourceRegistryEntry } from './source-registry';

export interface SourceCoverageSummary {
  totalSources: number;
  municipalSources: number;
  nationalSources: number;
  globalSources: number;
  nationalMunicipalCount: { national: number; municipal: number; global: number };
  byAccessStatus: Record<string, number>;
  byConnectorKind: Record<string, number>;
  byCategory: Record<string, number>;
  byVendor: Record<string, number>;
  byProvince: Record<string, number>;
  byCapability: Record<string, number>;
  publicCandidateCount: number;
  protectedCount: number;
  legalProtectedCount: number;
  topCoveredProvinces: Array<{ province: string; sourceCount: number; municipalCount: number; accessStatus: Record<string, number> }>;
  uncoveredProvinces: string[];
  metadataOnlyProvinces: string[];
  lastGeneratedAt: string;
}

export interface MunicipalitySourceSummary {
  id: string;
  name: string;
  homepageUrl: string;
  province?: string;
  district?: string;
  municipalitySlug?: string;
  vendor?: string;
  accessStatus: SourceAccessStatus;
  capabilities: string[];
  connectorKinds: ConnectorKind[];
}

export const PUBLIC_CANDIDATE_ACCESS_STATUSES: SourceAccessStatus[] = ['public', 'public_metadata', 'metadata_only', 'unknown'];
export const PROTECTED_ACCESS_STATUSES: SourceAccessStatus[] = ['requires_credentials', 'requires_legal_agreement'];

export function isProtectedSource(source: SourceRegistryEntry): boolean {
  return PROTECTED_ACCESS_STATUSES.includes(source.access.status);
}

export function isPublicCandidateSource(source: SourceRegistryEntry): boolean {
  return PUBLIC_CANDIDATE_ACCESS_STATUSES.includes(source.access.status) && !isProtectedSource(source);
}

export function summarizeSources(sources: SourceRegistryEntry[], generatedAt = new Date().toISOString()): SourceCoverageSummary {
  const byAccessStatus: Record<string, number> = {};
  const byConnectorKind: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byVendor: Record<string, number> = {};
  const byProvince: Record<string, number> = {};
  const byCapability: Record<string, number> = {};
  const provinceStats: Record<string, { sourceCount: number; municipalCount: number; accessStatus: Record<string, number> }> = {};

  for (const source of sources) {
    increment(byAccessStatus, source.access.status);
    for (const kind of source.connectorKinds) increment(byConnectorKind, kind);
    increment(byCategory, source.category);
    if (source.metadata?.vendor) increment(byVendor, source.metadata.vendor);
    if (source.metadata?.province) increment(byProvince, source.metadata.province);
    for (const capability of source.capabilities) increment(byCapability, capability);
    const province = source.metadata?.province;
    if (province) {
      if (!provinceStats[province]) provinceStats[province] = { sourceCount: 0, municipalCount: 0, accessStatus: {} };
      provinceStats[province].sourceCount += 1;
      increment(provinceStats[province].accessStatus, source.access.status);
      if (source.jurisdiction === 'municipal') provinceStats[province].municipalCount += 1;
    }
  }

  const topCoveredProvinces = Object.entries(provinceStats)
    .map(([province, stats]) => ({ province, ...stats }))
    .sort((a, b) => b.sourceCount - a.sourceCount || a.province.localeCompare(b.province, 'tr'))
    .slice(0, 10);

  const uncoveredProvinces = TURKEY_PROVINCES.filter((province) => !provinceStats[province.name]).map((province) => province.name);
  const metadataOnlyProvinces = Object.entries(provinceStats)
    .filter(([, stats]) => stats.accessStatus.metadata_only > 0 && (stats.accessStatus.public ?? 0) === 0 && (stats.accessStatus.requires_credentials ?? 0) === 0 && (stats.accessStatus.requires_legal_agreement ?? 0) === 0)
    .map(([province]) => province)
    .sort((a, b) => a.localeCompare(b, 'tr'));

  return {
    totalSources: sources.length,
    municipalSources: sources.filter((source) => source.jurisdiction === 'municipal').length,
    nationalSources: sources.filter((source) => source.jurisdiction === 'national').length,
    globalSources: sources.filter((source) => source.jurisdiction === 'global').length,
    nationalMunicipalCount: {
      national: sources.filter((source) => source.jurisdiction === 'national').length,
      municipal: sources.filter((source) => source.jurisdiction === 'municipal').length,
      global: sources.filter((source) => source.jurisdiction === 'global').length
    },
    byAccessStatus,
    byConnectorKind,
    byCategory,
    byVendor,
    byProvince,
    byCapability,
    publicCandidateCount: sources.filter(isPublicCandidateSource).length,
    protectedCount: sources.filter(isProtectedSource).length,
    legalProtectedCount: sources.filter((source) => source.access.status === 'requires_legal_agreement').length,
    topCoveredProvinces,
    uncoveredProvinces,
    metadataOnlyProvinces,
    lastGeneratedAt: generatedAt
  };
}

export function toMunicipalitySummary(source: SourceRegistryEntry): MunicipalitySourceSummary {
  return {
    id: source.id,
    name: source.name,
    homepageUrl: source.homepageUrl,
    province: source.metadata?.province,
    district: source.metadata?.district,
    municipalitySlug: source.metadata?.municipalitySlug,
    vendor: source.metadata?.vendor,
    accessStatus: source.access.status,
    capabilities: source.capabilities,
    connectorKinds: source.connectorKinds
  };
}

export function probeStatusToPublicHealthBucket(status: ProbeStatus): 'available' | 'requiresCredentials' | 'captcha' | 'unavailable' | 'errors' {
  if (status === ProbeStatus.Available || status === ProbeStatus.MethodContractRequired) return 'available';
  if (status === ProbeStatus.RequiresCredentials || status === ProbeStatus.RequiresLegalAgreement) return 'requiresCredentials';
  if (status === ProbeStatus.CaptchaRequired) return 'captcha';
  if (status === ProbeStatus.UnsupportedFormat) return 'errors';
  return 'unavailable';
}

function increment(target: Record<string, number>, key: string): void {
  target[key] = (target[key] ?? 0) + 1;
}
