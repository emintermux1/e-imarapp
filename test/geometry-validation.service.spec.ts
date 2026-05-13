import type * as GeoJSON from 'geojson';
import { GeometryValidationService } from '../src/geo/geometry-validation.service';

describe('GeometryValidationService', () => {
  const service = new GeometryValidationService();

  it('flags and optionally repairs unclosed rings plus duplicate consecutive vertices', () => {
    const result = service.validate({
      repair: true,
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [29, 41],
          [29.01, 41],
          [29.01, 41],
          [29.01, 41.01],
          [29, 41.01]
        ]]
      },
      metadata: { updatedAt: '2026-05-09T12:00:00.000Z' }
    });

    expect(result.status).toBe('warning');
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'DUPLICATE_CONSECUTIVE_VERTEX' }),
      expect.objectContaining({ code: 'UNCLOSED_RING' })
    ]));
    expect(result.repairSuggestions).toEqual(expect.arrayContaining(['strip_duplicate_consecutive_vertices', 'close_unclosed_rings_when_safe']));
    expect((result.repairedGeometry as GeoJSON.Polygon).coordinates[0]).toHaveLength(5);
  });

  it('detects basic polygon self-intersection without destructive repair', () => {
    const result = service.validate({
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [29, 41],
          [30, 42],
          [29, 42],
          [30, 41],
          [29, 41]
        ]]
      },
      metadata: { updatedAt: '2026-05-09T12:00:00.000Z' }
    });

    expect(result.status).toBe('error');
    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'SELF_INTERSECTION' })]));
    expect(result.repairedGeometry).toBeUndefined();
  });

  it('detects CRS/SRID mismatch', () => {
    const result = service.validate({
      srid: 3857,
      expectedSrid: 4326,
      geometry: { type: 'Point', coordinates: [29, 41] },
      metadata: { updatedAt: '2026-05-09T12:00:00.000Z' }
    });

    expect(result.status).toBe('error');
    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'CRS_MISMATCH' })]));
  });

  it('flags null metadata and invalid timestamps', () => {
    const nullMetadata = service.validate({ geometry: { type: 'Point', coordinates: [29, 41] }, metadata: null });
    const invalidTimestamp = service.validate({ geometry: { type: 'Point', coordinates: [29, 41] }, metadata: { updatedAt: 'bad-date' } });

    expect(nullMetadata.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'NULL_METADATA' })]));
    expect(invalidTimestamp.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'INVALID_TIMESTAMP' })]));
  });

  it('detects duplicate parcel candidates by key and geometry hash', () => {
    const geometry = { type: 'Point', coordinates: [29, 41] };
    const result = service.validate({
      feature: { type: 'Feature', properties: { ada: '1', parsel: '2', updatedAt: '2026-05-09T12:00:00.000Z' }, geometry },
      duplicateCandidates: [{ ada: '1', parsel: '2', geometry }]
    });

    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'DUPLICATE_PARCEL_CANDIDATE' })]));
  });

  it('warns on Turkey-ish bbox sanity failures', () => {
    const result = service.validate({
      geometry: { type: 'Point', coordinates: [2, 2] },
      metadata: { updatedAt: '2026-05-09T12:00:00.000Z' }
    });

    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'EXTENT_OUTSIDE_TURKEY_BOUNDS' })]));
  });
});
