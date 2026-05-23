import { Injectable } from '@nestjs/common';
import { ConnectorKind, ProbeResult, ProbeStatus } from './connector.types';

const TIMEOUT_MS = 4000;
const USER_AGENT = 'e-imarapp-connector-discovery/0.1 (+public metadata probe)';

@Injectable()
export class HttpProbeService {
  async probe(endpoint: string): Promise<ProbeResult> {
    let parsed: URL;
    try {
      parsed = new URL(endpoint);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol');
    } catch (error) {
      return { endpoint, status: ProbeStatus.UnsupportedFormat, detectedKinds: [], error: String(error) };
    }

    const head = await this.request(parsed.toString(), 'HEAD');
    if (head && head.status !== 405 && head.status !== 403) return this.toProbeResult(endpoint, head);

    const get = await this.request(parsed.toString(), 'GET');
    if (get) return this.toProbeResult(endpoint, get);

    return { endpoint, status: ProbeStatus.Unavailable, detectedKinds: [], error: 'Probe request failed or timed out.' };
  }

  private async request(endpoint: string, method: 'HEAD' | 'GET'): Promise<Response | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      return await fetch(endpoint, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: method === 'HEAD' ? '*/*' : 'text/html,application/xml,application/json,text/plain,*/*;q=0.8'
        }
      });
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  private async toProbeResult(endpoint: string, response: Response): Promise<ProbeResult> {
    const headers = this.sniffHeaders(response.headers);
    const contentType = response.headers.get('content-type');
    let sample = '';
    if (response.body && response.headers.get('content-length') !== '0') {
      try {
        const clone = response.clone();
        sample = (await clone.text()).slice(0, 12000);
      } catch {
        sample = '';
      }
    }

    const detectedKinds = this.detectKinds(endpoint, contentType, sample);
    const protectedStatus = this.detectProtectedStatus(response.status, sample, headers);
    const status = protectedStatus ?? this.httpStatusToProbeStatus(response.status, contentType, sample);

    return { endpoint, status, httpStatus: response.status, contentType, finalUrl: response.url, detectedKinds, headers };
  }

  private httpStatusToProbeStatus(status: number, contentType: string | null, sample: string): ProbeStatus {
    if (status === 401 || status === 403) return ProbeStatus.RequiresCredentials;
    if (status === 429) return ProbeStatus.RateLimited;
    if (status >= 200 && status < 400) {
      if (this.looksLikeMethodContractPage(contentType, sample)) return ProbeStatus.MethodContractRequired;
      return ProbeStatus.Available;
    }
    if (status === 404 || status === 410) return ProbeStatus.EndpointChanged;
    return ProbeStatus.Unavailable;
  }

  private detectProtectedStatus(status: number, sample: string, headers: Record<string, string>): ProbeStatus | null {
    const text = `${sample} ${Object.values(headers).join(' ')}`.toLocaleLowerCase('tr-TR');
    if (/captcha|recaptcha|hcaptcha|güvenlik kodu|guvenlik kodu|bot kontrol/.test(text)) return ProbeStatus.CaptchaRequired;
    if (/login|signin|oturum aç|oturum ac|giriş|giris|yetkisiz|unauthorized|forbidden/.test(text)) return ProbeStatus.RequiresCredentials;
    if (status === 401 || status === 403) return ProbeStatus.RequiresCredentials;
    return null;
  }

  private detectKinds(endpoint: string, contentType: string | null, sample: string): ConnectorKind[] {
    const haystack = `${endpoint} ${contentType ?? ''} ${sample}`.toLowerCase();
    const kinds = new Set<ConnectorKind>();
    if (/netgis|keos|\.ashx|\.asmx|imardurumu/.test(haystack)) kinds.add(ConnectorKind.NetcadKeos);
    if (/keos/.test(haystack)) kinds.add(ConnectorKind.Keos);
    if (/webgis|kentrehberi|e-?imar/.test(haystack)) kinds.add(ConnectorKind.Webgis);
    if (/service=wms|wms_capabilities/.test(haystack)) kinds.add(ConnectorKind.Wms);
    if (/service=wfs|wfs/.test(haystack)) kinds.add(ConnectorKind.Wfs);
    if (/geoserver/.test(haystack)) kinds.add(ConnectorKind.Geoserver);
    if (/service=wms|wms_capabilities|wfs|geoserver|getcapabilities|capability/.test(haystack)) kinds.add(ConnectorKind.Ogc);
    if (/arcgis\/rest|mapserver|featureserver/.test(haystack)) kinds.add(ConnectorKind.ArcgisRest);
    if (/mapserver/.test(haystack)) kinds.add(ConnectorKind.Mapserver);
    if (/overpass|openstreetmap/.test(haystack)) kinds.add(ConnectorKind.Overpass);
    if (/ekent/.test(haystack)) kinds.add(ConnectorKind.Ekent);
    return [...kinds];
  }

  private looksLikeMethodContractPage(contentType: string | null, sample: string): boolean {
    const text = sample.toLowerCase();
    return Boolean(contentType?.includes('text/html')) && (/asmx|web service|wsdl|method/.test(text));
  }

  private sniffHeaders(headers: Headers): Record<string, string> {
    const allowed = ['content-type', 'server', 'x-powered-by', 'www-authenticate', 'location'];
    const out: Record<string, string> = {};
    for (const key of allowed) {
      const value = headers.get(key);
      if (value) out[key] = value.slice(0, 240);
    }
    return out;
  }
}
