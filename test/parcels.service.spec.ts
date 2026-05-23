import { DatabaseService } from '../src/database/database.service';
import { ParcelsService } from '../src/parcels/parcels.service';

describe('ParcelsService', () => {
  it('returns not_ready when DATABASE_URL is not configured', async () => {
    const db = {
      isConfigured: () => false,
      notConfiguredIssue: () => ({ code: 'not_configured', message: 'DATABASE_URL missing' })
    } as unknown as DatabaseService;
    const service = new ParcelsService(db);

    const result = await service.queryParcel({ type: 'ada_parsel', ada: '101', parselNo: '7' }) as any;

    expect(result.status).toBe('not_ready');
    expect(result.count).toBe(0);
    expect(result.parcels).toEqual([]);
    expect(result.issue).toEqual({ code: 'not_configured', message: 'DATABASE_URL missing' });
    expect(result.query).toMatchObject({ type: 'ada_parsel', ada: '101', parselNo: '7', limit: 20 });
  });

  it('queries PostGIS parcels and returns stable parcel/source payloads', async () => {
    const db = {
      isConfigured: () => true,
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rowCount: 17,
          rows: [
            ...['id', 'source_id', 'municipality_id', 'ada', 'parsel_no', 'external_id', 'geom', 'attributes', 'source_fetched_at', 'created_at', 'updated_at'].map((column_name) => ({ table_name: 'parcels', column_name })),
            ...['id', 'name', 'homepage_url', 'access_status', 'category'].map((column_name) => ({ table_name: 'data_sources', column_name }))
          ]
        })
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [
            {
              id: 'parcel-1',
              source_id: 'source-1',
              municipality_id: 'municipality-1',
              ada: '101',
              parsel_no: '7',
              external_id: 'ext-7',
              attributes: { mahalle: 'Merkez' },
              source_fetched_at: '2026-05-01T10:00:00.000Z',
              created_at: '2026-05-01T09:00:00.000Z',
              updated_at: '2026-05-01T11:00:00.000Z',
              geometry: { type: 'MultiPolygon', coordinates: [] },
              centroid: { type: 'Point', coordinates: [29, 41] },
              bbox: { type: 'Polygon', coordinates: [] },
              area_m2: '123.45',
              source_name: 'Test Source',
              source_homepage_url: 'https://example.test',
              source_access_status: 'available',
              source_category: 'cadastre'
            }
          ]
        })
    } as unknown as DatabaseService;
    const service = new ParcelsService(db);

    const result = await service.queryParcel({
      type: 'ada_parsel',
      ada: '101',
      parselNo: '7',
      municipalityId: 'municipality-1',
      bbox: [28.9, 40.9, 29.1, 41.1],
      limit: 5
    }) as any;

    expect(result.status).toBe('ok');
    expect(result.count).toBe(1);
    expect(result.query).toMatchObject({ ada: '101', parselNo: '7', municipalityId: 'municipality-1', bbox: [28.9, 40.9, 29.1, 41.1], limit: 5 });
    expect(result.parcels[0]).toMatchObject({
      id: 'parcel-1',
      sourceId: 'source-1',
      municipalityId: 'municipality-1',
      ada: '101',
      parselNo: '7',
      externalId: 'ext-7',
      attributes: { mahalle: 'Merkez' },
      areaM2: 123.45,
      source: {
        sourceId: 'source-1',
        name: 'Test Source',
        homepageUrl: 'https://example.test',
        accessStatus: 'available',
        category: 'cadastre'
      },
      provenance: {
        sourceId: 'source-1',
        sourceName: 'Test Source',
        officialDataFabricated: false
      }
    });
    expect(result.sources).toEqual([expect.objectContaining({ sourceId: 'source-1', name: 'Test Source' })]);
    expect(result.provenance).toMatchObject({ database: 'postgis', table: 'parcels', officialDataFabricated: false });
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('from parcels p'), expect.arrayContaining(['101', '7', 'municipality-1', 28.9, 40.9, 29.1, 41.1, 5]));
  });

  it('returns actionable not_ready when configured schema is missing parcels', async () => {
    const db = {
      isConfigured: () => true,
      query: jest.fn().mockResolvedValueOnce({ rowCount: 0, rows: [] })
    } as unknown as DatabaseService;
    const service = new ParcelsService(db);

    const result = await service.queryParcel({ type: 'ada_parsel', ada: '101', parselNo: '7' }) as any;

    expect(result.status).toBe('not_ready');
    expect(result.count).toBe(0);
    expect(result.issue).toMatchObject({ code: 'unavailable', message: 'Parcel table is unavailable in the configured database.' });
    expect(result.nextActions[0]).toContain('Run database migrations');
  });

  it('returns actionable not_ready when configured query fails', async () => {
    const db = {
      isConfigured: () => true,
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rowCount: 6,
          rows: ['id', 'ada', 'parsel_no', 'geom', 'updated_at'].map((column_name) => ({ table_name: 'parcels', column_name }))
        })
        .mockRejectedValueOnce(new Error('relation "parcels" does not exist'))
    } as unknown as DatabaseService;
    const service = new ParcelsService(db);

    const result = await service.queryParcel({ type: 'ada_parsel', ada: '101', parselNo: '7' }) as any;

    expect(result.status).toBe('not_ready');
    expect(result.parcels).toEqual([]);
    expect(result.issue).toMatchObject({
      code: 'unavailable',
      message: 'Configured parcel database query failed.',
      detail: 'relation "parcels" does not exist'
    });
    expect(result.nextActions).toEqual(expect.arrayContaining([expect.stringContaining('Confirm PostGIS')]));
  });
});
