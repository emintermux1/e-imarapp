import { Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { DatabaseService } from '../database/database.service';
import { DiscoveryService } from './discovery.service';
import { HttpProbeService } from './http-probe.service';

@Injectable()
export class OgcDiscoveryService {
  private readonly parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

  constructor(
    private readonly db: DatabaseService,
    private readonly discovery: DiscoveryService,
    private readonly probe: HttpProbeService
  ) {}

  buildGetCapabilitiesUrl(base: string, path: string, service = 'WMS'): string {
    const absolute = new URL(path, base).toString();
    const delimiter = absolute.includes('?') ? '&' : '?';
    return `${absolute}${delimiter}request=GetCapabilities&service=${service}`;
  }

  async parseCapabilitiesXml(xml: string): Promise<{ serviceTitle?: string; srs: string[]; raw: unknown }> {
    const parsed = this.parser.parse(xml);
    return {
      serviceTitle: this.findFirst(parsed, ['Title', 'ows:Title']),
      srs: this.extractSrs(parsed),
      raw: parsed
    };
  }

  extractSrs(input: unknown): string[] {
    const out = new Set<string>();
    const visit = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        if (['SRS', 'CRS', 'DefaultCRS', 'OtherCRS', 'ows:SupportedCRS'].includes(key)) {
          const values = Array.isArray(child) ? child : [child];
          for (const item of values) {
            if (typeof item !== 'string') continue;
            for (const token of item.split(/[\s,]+/).map((part) => part.trim()).filter(Boolean)) out.add(token);
          }
        } else {
          visit(child);
        }
      }
    };
    visit(input);
    return [...out];
  }

  private findFirst(input: unknown, names: string[]): string | undefined {
    if (!input || typeof input !== 'object') return undefined;
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (names.includes(key) && typeof value === 'string') return value;
      const nested = this.findFirst(value, names);
      if (nested) return nested;
    }
    return undefined;
  }
}
