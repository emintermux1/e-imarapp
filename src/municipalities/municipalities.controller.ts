import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SourcesService } from '../sources/sources.service';

@ApiTags('municipalities')
@Controller(['municipalities', 'api/v1/municipalities'])
export class MunicipalitiesController {
  constructor(private readonly sources: SourcesService) {}

  @Post(':slug/discover')
  discover(@Param('slug') slug: string, @Query('force') force?: string) {
    const capability = this.sources.municipalityCapability(slug);
    const source = capability.source;
    const now = new Date().toISOString();
    return {
      slug,
      name: source?.name ?? slug,
      tested_patterns: source ? 3 : 0,
      live_endpoints: [],
      keos_url: source?.vendor === 'netcad' ? source.homepageUrl : null,
      wms_url: null,
      wfs_url: null,
      discovered_at: now,
      refresh_after: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      ogc: {
        status: 'not_ready',
        base_url: source?.homepageUrl ?? null,
        wms_url: null,
        wms_get_capabilities_url: null,
        wms_version: null,
        wfs_url: null,
        wfs_get_capabilities_url: null,
        available_layers: [],
        supported_srs: [],
        supported_formats: [],
        metadata: {
          force: force === 'true',
          capability,
          message: 'Compatibility facade; canlı OGC/KEOS contract doğrulanmadan endpoint yayınlanmaz.'
        },
        last_error: source ? 'method_contract_required' : 'source_not_registered',
        tested_urls: source ? this.candidateUrls(source.homepageUrl) : [],
        discovered_at: now,
        refresh_after: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }
    };
  }

  @Get(':slug/gis-endpoints')
  listGisEndpoints(@Param('slug') slug: string) {
    const capability = this.sources.municipalityCapability(slug);
    const source = capability.source;
    if (!source) return [];
    const now = new Date().toISOString();
    return [{
      id: `${source.id}:metadata`,
      source_id: source.id,
      municipality_id: null,
      base_url: source.homepageUrl,
      wms_url: '',
      wms_get_capabilities_url: '',
      wms_version: null,
      wfs_url: null,
      wfs_get_capabilities_url: null,
      available_layers: [],
      supported_srs: [],
      supported_formats: [],
      status: 'not_ready',
      discovered_at: now,
      refresh_after: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      last_error: 'method_contract_required',
      metadata: {
        capability,
        message: 'Registry kaydı var; public OGC endpoint contract henüz doğrulanmadı.'
      },
      created_at: null,
      updated_at: null
    }];
  }

  @Post(':slug/gis-endpoints/refresh')
  refreshGisEndpoints(@Param('slug') slug: string, @Query('force') force?: string) {
    return this.discover(slug, force ?? 'true');
  }

  private candidateUrls(homepageUrl: string): string[] {
    try {
      const url = new URL(homepageUrl);
      const base = `${url.protocol}//${url.host}`;
      return [
        homepageUrl,
        new URL('/geoserver/ows?service=WMS&request=GetCapabilities', base).toString(),
        new URL('/imardurumu/Services/ImarDurumu.asmx?WSDL', base).toString()
      ];
    } catch {
      return [homepageUrl];
    }
  }
}
