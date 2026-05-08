import { ConfigService } from '@nestjs/config';
import { AnalysisService } from '../src/analysis/analysis.service';
import { DatabaseService } from '../src/database/database.service';

describe('AnalysisService', () => {
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
