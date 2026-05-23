import { ConnectorKind } from '../connectors/connector.types';
import { inspectOptionalSecret, ProviderEnvDiagnostic } from '../config/provider-env';
import { SourceRegistryEntry } from './source-registry';

export type SourcePreflightStatus =
  | 'ready_for_probe'
  | 'ready_for_ingestion'
  | 'needs_method_contract'
  | 'requires_credentials'
  | 'requires_legal_agreement'
  | 'metadata_only'
  | 'unavailable';

export interface SourceRequirementDefinition {
  requiredEnv: string[];
  legalRequirement: 'none' | 'terms_review' | 'legal_agreement' | 'commercial_terms' | 'institutional_approval';
  credentialRequirement: 'none' | 'api_key' | 'oauth' | 'approved_session' | 'institutional_credentials' | 'secret_ref';
  productionUse: string;
  operatorAction: string;
}

export interface SourceRequirementEvaluation extends SourceRequirementDefinition {
  env: ProviderEnvDiagnostic[];
  missingEnv: string[];
  configuredEnv: string[];
  preflightStatus: SourcePreflightStatus;
  canAttemptLiveProbe: boolean;
  canStartIngestion: boolean;
}

const SOURCE_REQUIREMENTS: Record<string, SourceRequirementDefinition> = {
  'tkgm-parsel-sorgu': {
    requiredEnv: [],
    legalRequirement: 'terms_review',
    credentialRequirement: 'none',
    productionUse: 'Public parcel portal lookup with provenance and bilgi amaçlı/resmi belge disclaimer; do not represent results as a signed TKGM document.',
    operatorAction: 'Resolve the public portal query contract, returned geometry fields, and provenance before normalized parcel output is shown.'
  },
  maks: {
    requiredEnv: ['MAKS_LEGAL_AGREEMENT_REF', 'MAKS_CREDENTIALS_REF'],
    legalRequirement: 'institutional_approval',
    credentialRequirement: 'institutional_credentials',
    productionUse: 'Address registry enrichment after institutional access is approved.',
    operatorAction: 'Configure MAKS credential and approval references before any address registry ingestion.'
  },
  'edevlet-csb-tucbs': {
    requiredEnv: ['EDEVLET_TUCBS_CREDENTIALS_REF', 'EDEVLET_TUCBS_OAUTH_REF'],
    legalRequirement: 'institutional_approval',
    credentialRequirement: 'oauth',
    productionUse: 'Authenticated TUCBS/e-Devlet service catalog access through an approved institutional workflow.',
    operatorAction: 'Configure e-Devlet OAuth/credential references and keep browser/session automation out of public endpoints.'
  },
  'copernicus-data-space': {
    requiredEnv: ['COPERNICUS_OAUTH_REF'],
    legalRequirement: 'terms_review',
    credentialRequirement: 'oauth',
    productionUse: 'Sentinel imagery search/download through a configured Copernicus account or OAuth client.',
    operatorAction: 'Configure the Copernicus OAuth reference and verify product-specific terms before scheduled pulls.'
  },
  'mapbox-maps-api': {
    requiredEnv: ['MAPBOX_ACCESS_TOKEN'],
    legalRequirement: 'commercial_terms',
    credentialRequirement: 'api_key',
    productionUse: 'Commercial basemap/vector style provider for server-side map provider diagnostics and style templates.',
    operatorAction: 'Set MAPBOX_ACCESS_TOKEN in secrets. Use a separate NEXT_PUBLIC_MAPBOX_TOKEN with pk.* scope for browser styles.'
  },
  'maptiler-cloud-api': {
    requiredEnv: ['MAPTILER_API_KEY'],
    legalRequirement: 'commercial_terms',
    credentialRequirement: 'api_key',
    productionUse: 'Commercial vector/raster basemap provider and browser MapLibre style source.',
    operatorAction: 'Set MAPTILER_API_KEY for backend diagnostics and NEXT_PUBLIC_MAPTILER_KEY for the web map client.'
  },
  'here-map-tile-api': {
    requiredEnv: ['HERE_API_KEY'],
    legalRequirement: 'commercial_terms',
    credentialRequirement: 'api_key',
    productionUse: 'HERE raster/vector/routing context provider for map diagnostics and future routing context.',
    operatorAction: 'Set HERE_API_KEY in secrets and verify plan limits before adding browser-facing tile templates.'
  },
  'cesium-ion': {
    requiredEnv: ['CESIUM_ION_TOKEN'],
    legalRequirement: 'commercial_terms',
    credentialRequirement: 'api_key',
    productionUse: 'Cesium World Terrain, 3D Tiles, and ion asset access for the 3D GIS scene.',
    operatorAction: 'Set CESIUM_ION_TOKEN for backend diagnostics and NEXT_PUBLIC_CESIUM_ION_TOKEN only if the token is scoped for browser use.'
  }
};

const CONTRACT_CONNECTORS = new Set<ConnectorKind>([
  ConnectorKind.NetcadKeos,
  ConnectorKind.Keos,
  ConnectorKind.Webgis,
  ConnectorKind.Ekent,
  ConnectorKind.Ogc,
  ConnectorKind.Wms,
  ConnectorKind.Wfs,
  ConnectorKind.Geoserver,
  ConnectorKind.ArcgisRest,
  ConnectorKind.PublicApi,
  ConnectorKind.PublicPortal
]);

export function requirementForSource(source: SourceRegistryEntry): SourceRequirementDefinition {
  const explicit = SOURCE_REQUIREMENTS[source.id];
  if (explicit) return explicit;

  if (source.access.status === 'requires_legal_agreement') {
    return {
      requiredEnv: [`${source.id.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_LEGAL_REF`],
      legalRequirement: 'legal_agreement',
      credentialRequirement: 'secret_ref',
      productionUse: 'Protected official source; production ingestion requires a legal access reference.',
      operatorAction: 'Configure the legal agreement reference in the secret manager before live ingestion.'
    };
  }

  if (source.access.status === 'requires_credentials') {
    return {
      requiredEnv: [`${source.id.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_CREDENTIALS_REF`],
      legalRequirement: 'institutional_approval',
      credentialRequirement: 'institutional_credentials',
      productionUse: 'Protected source; production ingestion requires approved credentials.',
      operatorAction: 'Configure an approved credential reference before live ingestion.'
    };
  }

  if (source.connectorKinds.some((kind) => CONTRACT_CONNECTORS.has(kind))) {
    return {
      requiredEnv: [],
      legalRequirement: source.access.status === 'public_metadata' || source.access.status === 'metadata_only' ? 'none' : 'terms_review',
      credentialRequirement: 'none',
      productionUse: 'Public portal/API candidate; live data can be used only after endpoint and method contract discovery succeeds.',
      operatorAction: 'Run public discovery, resolve WSDL/OGC/REST method contracts, and store provenance before ingestion.'
    };
  }

  return {
    requiredEnv: [],
    legalRequirement: 'none',
    credentialRequirement: 'none',
    productionUse: 'Registry metadata source.',
    operatorAction: 'No credential setup is required; expose as metadata unless a callable endpoint is discovered.'
  };
}

export function evaluateSourceRequirement(
  source: SourceRegistryEntry,
  readEnv: (envName: string) => unknown = (envName) => process.env[envName]
): SourceRequirementEvaluation {
  const definition = requirementForSource(source);
  const env = definition.requiredEnv.map((envName) => inspectOptionalSecret(envName, readEnv(envName)));
  const missingEnv = env.filter((item) => !item.configured).map((item) => item.envName);
  const configuredEnv = env.filter((item) => item.configured).map((item) => item.envName);
  const preflightStatus = resolvePreflightStatus(source, definition, missingEnv);

  return {
    ...definition,
    env,
    missingEnv,
    configuredEnv,
    preflightStatus,
    canAttemptLiveProbe: ['ready_for_probe', 'ready_for_ingestion', 'needs_method_contract'].includes(preflightStatus),
    canStartIngestion: preflightStatus === 'ready_for_ingestion'
  };
}

function resolvePreflightStatus(
  source: SourceRegistryEntry,
  definition: SourceRequirementDefinition,
  missingEnv: string[]
): SourcePreflightStatus {
  if (source.access.status === 'requires_legal_agreement') {
    return missingEnv.length > 0 ? 'requires_legal_agreement' : 'ready_for_probe';
  }

  if (source.access.status === 'requires_credentials') {
    return missingEnv.length > 0 ? 'requires_credentials' : 'ready_for_probe';
  }

  if (definition.requiredEnv.length > 0 && missingEnv.length > 0) {
    return definition.credentialRequirement === 'api_key' ? 'requires_credentials' : 'unavailable';
  }

  if (source.access.status === 'public_metadata' || source.access.status === 'metadata_only') {
    return 'metadata_only';
  }

  if (source.connectorKinds.some((kind) => CONTRACT_CONNECTORS.has(kind))) {
    return 'needs_method_contract';
  }

  if (source.access.status === 'public') {
    return 'ready_for_ingestion';
  }

  return 'ready_for_probe';
}
