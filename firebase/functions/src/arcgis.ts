import { MunicipalProviderConfig } from './config';
import { Point } from './geo';

export type ArcGisLayerSummary = {
  id: number;
  name: string;
  type?: string;
  geometryType?: string | null;
  parentLayerId?: number;
  defaultVisibility?: boolean;
  subLayerIds?: number[] | null;
  minScale?: number;
  maxScale?: number;
};

export type ArcGisServiceMetadata = {
  currentVersion?: number;
  serviceDescription?: string;
  capabilities?: string;
  supportedQueryFormats?: string;
  copyrightText?: string;
  spatialReference?: unknown;
  layers: ArcGisLayerSummary[];
};

export type PlanFeature = {
  providerId: string;
  layerId: number;
  layerName: string;
  attributes: Record<string, unknown>;
  geometry?: unknown;
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }

  return (await response.json()) as T;
};

const serviceMetadataUrl = (provider: MunicipalProviderConfig): string => {
  if (provider.serviceType === 'ArcGISMapServer') {
    return `${provider.serviceUrl.replace(/\/$/, '')}/layers?f=pjson`;
  }

  return `${provider.serviceUrl.replace(/\/$/, '')}?f=pjson`;
};

export const getArcGisLayers = async (
  provider: MunicipalProviderConfig
): Promise<ArcGisServiceMetadata> => {
  const metadata = await fetchJson<Partial<ArcGisServiceMetadata>>(serviceMetadataUrl(provider));
  return {
    currentVersion: metadata.currentVersion,
    serviceDescription: metadata.serviceDescription,
    capabilities: metadata.capabilities,
    supportedQueryFormats: metadata.supportedQueryFormats,
    copyrightText: metadata.copyrightText,
    spatialReference: metadata.spatialReference,
    layers: Array.isArray(metadata.layers) ? metadata.layers : []
  };
};

const queryLayerByPoint = async (
  provider: MunicipalProviderConfig,
  layer: ArcGisLayerSummary,
  point: Point
): Promise<PlanFeature[]> => {
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    outFields: '*',
    returnGeometry: 'true',
    inSR: '4326',
    outSR: '4326',
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    geometry: JSON.stringify({ x: point.lng, y: point.lat, spatialReference: { wkid: 4326 } })
  });
  const url = `${provider.serviceUrl.replace(/\/$/, '')}/${layer.id}/query?${params.toString()}`;
  const payload = await fetchJson<{ features?: Array<{ attributes?: Record<string, unknown>; geometry?: unknown }>; error?: unknown }>(url);

  if (!Array.isArray(payload.features)) {
    return [];
  }

  return payload.features.slice(0, 10).map((feature) => ({
    providerId: provider.id,
    layerId: layer.id,
    layerName: layer.name,
    attributes: feature.attributes ?? {},
    geometry: feature.geometry
  }));
};

const isQueryablePlanLayer = (layer: ArcGisLayerSummary): boolean => {
  if (layer.subLayerIds && layer.subLayerIds.length > 0) {
    return false;
  }

  const geometryType = layer.geometryType ?? '';
  if (!geometryType.includes('Polygon')) {
    return false;
  }

  const name = layer.name.toLocaleLowerCase('tr-TR');
  return ['imar', 'plan', 'alan', 'kullanım', 'kullanim'].some((term) => name.includes(term));
};

export const queryPlanLayersByPoint = async (
  provider: MunicipalProviderConfig,
  point: Point
): Promise<PlanFeature[]> => {
  const metadata = await getArcGisLayers(provider);
  const queryableLayers = metadata.layers.filter(isQueryablePlanLayer).slice(0, 12);
  const settled = await Promise.allSettled(
    queryableLayers.map((layer) => queryLayerByPoint(provider, layer, point))
  );

  return settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
};
