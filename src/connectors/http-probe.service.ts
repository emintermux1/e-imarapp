import { Injectable } from '@nestjs/common';
import { IntegrationErrorCode } from '../common/error-taxonomy';
import { ConnectorKind, EndpointProbeResult, ProbeStatus } from './connector.types';

const DEFAULT_TIMEOUT_MS = 8000;

@Injectable()
export class HttpProbeService {
  async probe(endpoint: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<EndpointProbeResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'user-agent': 'turkiye-e-imar-discovery/0.1 (+https://example.invalid/agent)'
        }
      });
      const contentType = response.headers.get('content-type') ?? undefined;
      const body = await this.safeReadBody(response, contentType);
      return {
        endpoint,
        status: this.mapHttpStatus(response.status, body),
        httpStatus: response.status,
        contentType,
        title: this.extractTitle(body),
        detectedKinds: this.detectKinds(endpoint, contentType, body),
        issue: this.issueForStatus(endpoint, response.status, body)
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown network error';
      return {
        endpoint,
        status: ProbeStatus.Unavailable,
        detectedKinds: this.detectKinds(endpoint),
        issue: {
          code: IntegrationErrorCode.Unavailable,
          endpoint,
          message
        }
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async safeReadBody(response: Response, contentType?: string): Promise<string> {
    if (!contentType || (!contentType.includes('text') && !contentType.includes('json') && !contentType.includes('xml'))) {
      return '';
    }

    const text = await response.text();
    return text.slice(0, 200_000);
  }

  private mapHttpStatus(httpStatus: number, body: string): ProbeStatus {
    if (httpStatus === 401 || httpStatus === 403) {
      return ProbeStatus.RequiresCredentials;
    }
    if (httpStatus === 429) {
      return ProbeStatus.RateLimited;
    }
    if (this.looksLikeCaptcha(body)) {
      return ProbeStatus.CaptchaRequired;
    }
    if (httpStatus >= 200 && httpStatus < 400) {
      return ProbeStatus.Available;
    }
    return ProbeStatus.Unavailable;
  }

  private issueForStatus(endpoint: string, httpStatus: number, body: string) {
    if (httpStatus === 401 || httpStatus === 403) {
      return {
        code: IntegrationErrorCode.RequiresCredentials,
        endpoint,
        message: 'Endpoint requires authentication, authorization, or an allowed browser/session context.'
      };
    }
    if (httpStatus === 429) {
      return {
        code: IntegrationErrorCode.RateLimited,
        endpoint,
        message: 'Endpoint returned a rate limit response. Connector must use backoff and source-specific limits.'
      };
    }
    if (this.looksLikeCaptcha(body)) {
      return {
        code: IntegrationErrorCode.CaptchaRequired,
        endpoint,
        message: 'Endpoint content indicates captcha or bot protection. Browser/session workflow is required.'
      };
    }
    if (httpStatus >= 400) {
      return {
        code: IntegrationErrorCode.Unavailable,
        endpoint,
        message: `Endpoint returned HTTP ${httpStatus}.`
      };
    }
    return undefined;
  }

  private extractTitle(body: string): string | undefined {
    const match = body.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match?.[1]?.trim().replace(/\s+/g, ' ');
  }

  private looksLikeCaptcha(body: string): boolean {
    return /captcha|robot olmadığınızı|bot protection|turnstile|recaptcha|hcaptcha/i.test(body);
  }

  private detectKinds(endpoint: string, contentType = '', body = ''): ConnectorKind[] {
    const haystack = `${endpoint}\n${contentType}\n${body.slice(0, 20_000)}`.toLowerCase();
    const kinds = new Set<ConnectorKind>();

    if (haystack.includes('service=wms') || haystack.includes('wms')) {
      kinds.add(ConnectorKind.Wms);
    }
    if (haystack.includes('service=wfs') || haystack.includes('wfs')) {
      kinds.add(ConnectorKind.Wfs);
    }
    if (haystack.includes('/arcgis/rest/services') || haystack.includes('arcgis')) {
      kinds.add(ConnectorKind.ArcGisRest);
    }
    if (haystack.includes('geoserver')) {
      kinds.add(ConnectorKind.GeoServer);
    }
    if (haystack.includes('keos') || haystack.includes('netcad') || haystack.includes('netgis')) {
      kinds.add(ConnectorKind.NetcadKeos);
    }
    if (haystack.includes('/tile/') || haystack.includes('wmts') || haystack.includes('xyz')) {
      kinds.add(ConnectorKind.RasterTile);
    }
    if (haystack.includes('vectortile') || haystack.includes('vector tile') || haystack.includes('mvt')) {
      kinds.add(ConnectorKind.VectorTile);
    }
    if (haystack.includes('sentinel') || haystack.includes('landsat') || haystack.includes('world imagery')) {
      kinds.add(ConnectorKind.Satellite);
    }
    if (haystack.includes('imardurumu') || haystack.includes('imar durumu') || haystack.includes('webgis')) {
      kinds.add(ConnectorKind.MunicipalPortal);
    }

    return [...kinds];
  }
}
