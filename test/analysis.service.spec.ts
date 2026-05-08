import { ConfigService } from '@nestjs/config';
import { AnalysisService } from '../src/analysis/analysis.service';
import { DatabaseService } from '../src/database/database.service';

describe('AnalysisService', () => {
  it('maps runs from the real ai_analysis_runs schema', async () => {
    const db = {
      isConfigured: () => true,
      query: jest.fn().mockResolvedValue({
        rowCount: 1,
        rows: [
          {
            id: 'run-1',
            source_id: 'source-1',
            plan_id: 'plan-1',
            parcel_id: null,
            analysis_type: 'plan_note_summary',
            status: 'completed',
            input_ref: { parcelId: 'parcel-1' },
            output: { plainSummary: 'Özet metni', bullets: ['Madde 1'] },
            confidence: '0.82',
            created_at: '2026-05-01T10:00:00.000Z',
            updated_at: '2026-05-01T10:05:00.000Z'
          }
        ]
      })
    } as unknown as DatabaseService;
    const config = {
      get: () => undefined
    } as unknown as ConfigService;
    const service = new AnalysisService(db, config);

    const result = await service.runs(25) as {
      status: string;
      count: number;
      runs: Array<{
        id: string;
        parcelId: string | null;
        confidenceScore: number | null;
        resultSummary: string | null;
        resultPayload: Record<string, unknown>;
        completedAt: string | null;
      }>;
    };

    expect(result.status).toBe('ok');
    expect(result.count).toBe(1);
    expect(result.runs[0]).toMatchObject({
      id: 'run-1',
      parcelId: 'parcel-1',
      confidenceScore: 0.82,
      resultSummary: 'Özet metni',
      completedAt: '2026-05-01T10:05:00.000Z'
    });
    expect(result.runs[0]?.resultPayload).toEqual({ plainSummary: 'Özet metni', bullets: ['Madde 1'] });
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('from ai_analysis_runs'), [25]);
  });

  it('looks up provenance using parcel_id and input_ref from the real schema', async () => {
    const db = {
      isConfigured: () => true,
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id: 'snapshot-1', source_id: 'source-1', created_at: '2026-05-01T09:00:00.000Z' }]
        })
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [
            {
              id: 'run-2',
              source_id: 'source-1',
              plan_id: null,
              parcel_id: 'parcel-2',
              analysis_type: 'source_confidence',
              status: 'requires_review',
              input_ref: { parcel_id: 'parcel-2' },
              output: { summary: 'Kaynak güveni düşük' },
              confidence: 0.45,
              created_at: '2026-05-01T09:10:00.000Z',
              updated_at: '2026-05-01T09:12:00.000Z'
            }
          ]
        })
    } as unknown as DatabaseService;
    const config = {
      get: () => undefined
    } as unknown as ConfigService;
    const service = new AnalysisService(db, config);

    const result = await service.provenance('parcel-2') as {
      parcelId: string;
      aiAnalyses: Array<{ parcelId: string | null; resultSummary: string | null; completedAt: string | null }>;
    };

    expect(result.parcelId).toBe('parcel-2');
    expect(result.aiAnalyses[0]).toMatchObject({
      parcelId: 'parcel-2',
      resultSummary: 'Kaynak güveni düşük',
      completedAt: '2026-05-01T09:12:00.000Z'
    });
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("input_ref ->> 'parcelId' = $1"),
      ['parcel-2']
    );
  });

  it('returns parcel potential summary from direct inputs', async () => {
    const db = {
      isConfigured: () => false
    } as DatabaseService;
    const config = {
      get: () => undefined
    } as unknown as ConfigService;
    const service = new AnalysisService(db, config);

    const result = await service.parcelPotentialSummary({
      parcelAreaM2: 500,
      emsal: 1.2,
      taks: 0.4,
      zoningFunction: 'konut'
    }) as { status: string; summary: { maxBuildingType: string; estimatedIndependentUnits: number } };

    expect(result.status).toBe('ok');
    expect(result.summary.maxBuildingType).toBe('konut_blok');
    expect(result.summary.estimatedIndependentUnits).toBeGreaterThan(0);
  });

  it('returns requires_credentials when OpenAI key missing', async () => {
    const db = {} as DatabaseService;
    const config = {
      get: () => undefined
    } as unknown as ConfigService;
    const service = new AnalysisService(db, config);

    const result = await service.explainPlanNotes({ noteText: 'Emsal: 1.50, TAKS: 0.40' }) as { status: string };
    expect(result.status).toBe('requires_credentials');
  });
});
