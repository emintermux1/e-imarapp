import { Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';

const TUCBS_WMS_BASE = 'https://tucbs-public-api.csb.gov.tr';

const TUCBS_WMS_PATHS = [
  '/wms',
  '/geoserver/wms',
  '/ows'
];

@Injectable()
export class TucbsCrossRefService {
  private readonly logger = new Logger(TucbsCrossRefService.name);
  private readonly parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

  async discoverCapabilities(): Promise<unknown> {
    for (const path of TUCBS_WMS_PATHS) {
      const url = `${TUCBS_WMS_BASE}${path}?service=WMS&request=GetCapabilities`;
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'turkiye-e-imar-tucbs/1.0' }
        });

        if (!response.ok) continue;

        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('xml')) continue;

        const xml = await response.text();
        const json = this.parser.parse(xml);
        const caps = json.WMS_Capabilities || json.WMT_MS_Capabilities;
        if (!caps) continue;

        const layers = this.extractLayers(caps);

        return {
          status: 'ok',
          endpoint: url,
          version: caps['@_version'],
          layerCount: layers.length,
          layers,
          crossRefNote: 'Use these layers to cross-reference e-Plan data with national geospatial context.'
        };
      } catch (err) {
        this.logger.warn(`TUCBS probe failed for ${url}: ${err}`);
      }
    }

    return {
      status: 'unavailable',
      message: 'No working TUCBS WMS endpoint found. The public API may be temporarily down or path structure may have changed.'
    };
  }

  private extractLayers(caps: any): string[] {
    const layers: string[] = [];
    const root = caps.Capability?.Layer;
    if (!root) return layers;

    const walk = (node: any) => {
      if (node.Name) layers.push(node.Name);
      if (node.Layer) {
        if (Array.isArray(node.Layer)) node.Layer.forEach(walk);
        else walk(node.Layer);
      }
    };
    walk(root);
    return [...new Set(layers)];
  }
}
