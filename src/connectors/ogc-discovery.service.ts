import { Injectable, NotFoundException } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { DatabaseService } from '../database/database.service';
import { DiscoveryService } from './discovery.service';
import { HttpProbeService } from './http-probe.service';
import { ConnectorKind } from './connector.types';

const COMMON_WMS_PATHS = [
  '/wms.ashx',
  '/webgis_net/wms.ashx',
  '/netgis7/wms',
  '/netgis5/wms',
  '/gisapi/wms',
  '/WebGIS/wms',
  '/keos/wms',
  '/netgis/wms',
  '/wms',
  '/wms?'
];

interface OgcCapabilities {
  wmsUrl: string;
  wfsUrl?: string;
  layers: string[];
  supportedSrs: string[];
  supportedFormats: string[];
  version?: string;
}

@Injectable()
export class OgcDiscoveryService {
  private readonly parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

  constructor(
    private readonly db: DatabaseService,
    private readonly discovery: DiscoveryService,
    private readonly httpProbe: HttpProbeService
  ) {}

  async discoverForSource(sourceId: string) {
    const source = this.discovery.getSource(sourceId);

    if (!source.connectorKinds.includes(ConnectorKind.NetcadKeos) && !source.homepageUrl.includes('keos')) {
      throw new NotFoundException(`Source '${sourceId}' is not a Netcad/KEOS candidate.`);
    }

    const baseUrl = this.toBaseUrl(source.homepageUrl);
    let successful: OgcCapabilities | null = null;

    for (const path of COMMON_WMS_PATHS) {
      const candidate = this.buildGetCapabilitiesUrl(baseUrl, path);
      const probe = await this.httpProbe.probe(candidate);

      if (probe.status === 'available' && probe.contentType?.includes('xml')) {
        const caps = await this.fetchAndParseCapabilities(candidate);
        if (caps) {
          successful = { ...caps, wmsUrl: candidate.split('?')[0] || candidate };
          break;
        }
      }
    }

    if (!successful) {
      return {
        sourceId,
        status: 'unsupported_format',
        message: 'No working WMS GetCapabilities endpoint found among common Netcad paths.'
      };
    }

    // WFS aynı host'ta genellikle vardır
    const wfsUrl = this.deriveWfsUrl(successful.wmsUrl) || undefined;

    await this.persistEndpoint(source.id, baseUrl, successful, wfsUrl);

    return {
      sourceId,
      baseUrl,
      wmsUrl: successful.wmsUrl,
      wfsUrl,
      layers: successful.layers,
      supportedSrs: successful.supportedSrs,
      discoveredAt: new Date().toISOString()
    };
  }

  private async fetchAndParseCapabilities(url: string): Promise<OgcCapabilities | null> {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'turkiye-e-imar-ogc/1.0',
          'Referer': url.split('?')[0]
        }
      });
      if (!res.ok) return null;

      const xml = await res.text();
      const json = this.parser.parse(xml);

      const caps = json.WMS_Capabilities || json.WMT_MS_Capabilities;
      if (!caps) return null;

      const layerList = this.extractLayers(caps);
      const srsList = this.extractSrs(caps);
      const formats = this.extractFormats(caps);

      return {
        wmsUrl: url.split('?')[0] || url,
        layers: layerList,
        supportedSrs: srsList,
        supportedFormats: formats,
        version: caps['@_version']
      };
    } catch {
      return null;
    }
  }

  private extractLayers(caps: any): string[] {
    const layers: string[] = [];
    const layerRoot = caps.Capability?.Layer;
    if (!layerRoot) return layers;

    const walk = (node: any) => {
      if (node.Name) layers.push(node.Name);
      if (node.Layer) {
        if (Array.isArray(node.Layer)) node.Layer.forEach(walk);
        else walk(node.Layer);
      }
    };
    walk(layerRoot);
    return [...new Set(layers)];
  }

  private extractSrs(caps: any): string[] {
    const srs: string[] = [];
    const layerRoot = caps.Capability?.Layer;
    if (!layerRoot) return srs;

    const walk = (node: any) => {
      if (node.SRS) {
        if (Array.isArray(node.SRS)) srs.push(...node.SRS);
        else srs.push(node.SRS);
      }
      if (node.CRS) {
        if (Array.isArray(node.CRS)) srs.push(...node.CRS);
        else srs.push(node.CRS);
      }
      if (node.Layer) {
        if (Array.isArray(node.Layer)) node.Layer.forEach(walk);
        else walk(node.Layer);
      }
    };
    walk(layerRoot);
    return [...new Set(srs)];
  }

  private extractFormats(caps: any): string[] {
    const formats: string[] = [];
    const request = caps.Capability?.Request?.GetMap;
    if (request?.Format) {
      if (Array.isArray(request.Format)) formats.push(...request.Format);
      else formats.push(request.Format);
    }
    return formats;
  }

  private deriveWfsUrl(wmsBase: string): string | undefined {
    // Netcad'te WFS genellikle aynı host'ta /wfs.ashx veya /netgis/wfs şeklinde olur
    const base = wmsBase.replace(/\/wms.*$/, '');
    return `${base}/wfs.ashx`;
  }

  private buildGetCapabilitiesUrl(base: string, path: string): string {
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `${base}${clean}?request=GetCapabilities&service=WMS`;
  }

  private toBaseUrl(url: string): string {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  }

  private async persistEndpoint(
    sourceId: string,
    baseUrl: string,
    caps: OgcCapabilities,
    wfsUrl?: string
  ) {
    const sql = `
      INSERT INTO municipal_gis_endpoints
        (source_id, base_url, wms_url, wms_get_capabilities_url, wfs_url, wfs_get_capabilities_url,
         available_layers, supported_srs, supported_formats, status, discovered_at, refresh_after)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'available', now(), now() + interval '7 days')
      ON CONFLICT (source_id, base_url) DO UPDATE SET
        wms_url = EXCLUDED.wms_url,
        wfs_url = EXCLUDED.wfs_url,
        available_layers = EXCLUDED.available_layers,
        supported_srs = EXCLUDED.supported_srs,
        supported_formats = EXCLUDED.supported_formats,
        status = 'available',
        discovered_at = now(),
        refresh_after = now() + interval '7 days',
        updated_at = now()
    `;

    await this.db.query(sql, [
      sourceId,
      baseUrl,
      caps.wmsUrl,
      `${caps.wmsUrl}?request=GetCapabilities&service=WMS`,
      wfsUrl ?? null,
      wfsUrl ? `${wfsUrl}?request=GetCapabilities&service=WFS` : null,
      JSON.stringify(caps.layers),
      caps.supportedSrs,
      caps.supportedFormats
    ]);
  }
}
