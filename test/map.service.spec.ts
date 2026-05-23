import { ConfigService } from '@nestjs/config';
import { MapService } from '../src/map/map.service';

describe('MapService', () => {
  it('reports configured providers without exposing secret values', () => {
    const config = {
      get: (key: string) =>
        ({
          MAPTILER_API_KEY: 'maptiler-secret',
          MAPBOX_ACCESS_TOKEN: 'mapbox-secret',
          CESIUM_ION_TOKEN: 'cesium-secret',
          HERE_API_KEY: 'here-secret'
        })[key]
    } as ConfigService;
    const service = new MapService(config);

    expect(service.providers()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'maptiler', configured: true }),
        expect.objectContaining({ id: 'mapbox', configured: true }),
        expect.objectContaining({ id: 'cesium-ion', configured: true }),
        expect.objectContaining({ id: 'here', configured: true })
      ])
    );
    expect(JSON.stringify(service.providers())).not.toContain('secret');
  });

  it('reports missing or malformed provider envs without exposing values', () => {
    const config = {
      get: (key: string) =>
        ({
          MAPTILER_API_KEY: 'change-me',
          MAPBOX_ACCESS_TOKEN: ' ',
          CESIUM_ION_TOKEN: 'cesium-secret',
          HERE_API_KEY: undefined
        })[key]
    } as ConfigService;
    const service = new MapService(config);

    expect(service.providers()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'maptiler', configured: false, envStatus: 'malformed' }),
        expect.objectContaining({ id: 'mapbox', configured: false, envStatus: 'missing' }),
        expect.objectContaining({ id: 'cesium-ion', configured: true, envStatus: 'configured' }),
        expect.objectContaining({ id: 'here', configured: false, envStatus: 'missing' })
      ])
    );
    expect(JSON.stringify(service.providers())).not.toContain('cesium-secret');
    expect(JSON.stringify(service.providerHealth())).not.toContain('change-me');
  });

  it('keeps URL templates symbolic instead of interpolating keys', () => {
    const config = {
      get: (key: string) => (key === 'MAPBOX_ACCESS_TOKEN' ? 'mapbox-secret' : undefined)
    } as ConfigService;
    const service = new MapService(config);

    expect(JSON.stringify(service.providerStyles())).toContain('${MAPBOX_ACCESS_TOKEN}');
    expect(JSON.stringify(service.providerStyles())).not.toContain('mapbox-secret');
  });
});
