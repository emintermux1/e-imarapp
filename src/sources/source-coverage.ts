import { ConnectorKind, ProbeStatus } from '../connectors/connector.types';
import { SourceAccessStatus, SourceRegistryEntry } from './source-registry';

export interface SourceCoverageSummary {
  totalSources: number;
  municipalSources: number;
  nationalSources: number;
  globalSources: number;
  byAccessStatus: Record<string, number>;
  byConnectorKind: Record<string, number>;
  byVendor: Record<string, number>;
  byProvince: Record<string, number>;
  publicCandidateCount: number;
  protectedCount: number;
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

export const PUBLIC_CANDIDATE_ACCESS_STATUSES: SourceAccessStatus[] = ['public', 'public_metadata', 'unknown'];
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
  const byVendor: Record<string, number> = {};
  const byProvince: Record<string, number> = {};

  for (const source of sources) {
    increment(byAccessStatus, source.access.status);
    for (const kind of source.connectorKinds) increment(byConnectorKind, kind);
    if (source.metadata?.vendor) increment(byVendor, source.metadata.vendor);
    if (source.metadata?.province) increment(byProvince, source.metadata.province);
  }

  return {
    totalSources: sources.length,
    municipalSources: sources.filter((source) => source.jurisdiction === 'municipal').length,
    nationalSources: sources.filter((source) => source.jurisdiction === 'national').length,
    globalSources: sources.filter((source) => source.jurisdiction === 'global').length,
    byAccessStatus,
    byConnectorKind,
    byVendor,
    byProvince,
    publicCandidateCount: sources.filter(isPublicCandidateSource).length,
    protectedCount: sources.filter(isProtectedSource).length,
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
