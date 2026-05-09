import { haversineDistanceMeters, pathDistanceMeters, polygonAreaSquareMeters, radiusAreaSquareMeters, circlePolygon } from '../apps/e_imar_web/src/lib/geo/measure';
import { buildShareMapUrl, serializeShareMapParams } from '../apps/e_imar_web/src/lib/map/share-link';
import { mergeMultiSelection, toggleMultiSelection } from '../apps/e_imar_web/src/lib/map/multi-select';

describe('map measurement helpers', () => {
  it('calculates WGS84 distance and path length approximately', () => {
    const meters = haversineDistanceMeters([29, 41], [29.01, 41]);
    expect(meters).toBeGreaterThan(830);
    expect(meters).toBeLessThan(850);
    expect(pathDistanceMeters([[29, 41], [29.01, 41], [29.02, 41]])).toBeCloseTo(meters * 2, 0);
  });

  it('calculates polygon and radius areas', () => {
    const area = polygonAreaSquareMeters([[29, 41], [29.01, 41], [29.01, 41.01], [29, 41.01]]);
    expect(area).toBeGreaterThan(900000);
    expect(area).toBeLessThan(950000);
    expect(radiusAreaSquareMeters(10)).toBeCloseTo(Math.PI * 100, 6);
    expect(circlePolygon([29, 41], 100, 8)).toHaveLength(9);
  });
});

describe('share links and multi-select reducer', () => {
  it('serializes shareable map state', () => {
    expect(serializeShareMapParams({ center: [29.1234567, 41.7654321], zoom: 16.204, basemap: 'voyager', selectedParcelIds: ['a', 'a', 'b'] })).toBe('lat=41.765432&lng=29.123457&z=16.2&basemap=voyager&parcels=a%2Cb');
    expect(buildShareMapUrl({ center: [29, 41], zoom: 12, basemap: 'topographic' }, 'https://imar.test/map?x=1')).toBe('https://imar.test/map?x=1&lat=41&lng=29&z=12&basemap=topographic');
  });

  it('toggles and merges parcel selections with limit', () => {
    expect(toggleMultiSelection(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleMultiSelection(['a', 'b'], 'a')).toEqual(['b']);
    expect(mergeMultiSelection(['a'], ['b', 'c', 'd'], 3)).toEqual({ ids: ['a', 'b', 'c'], truncated: true });
  });
});
