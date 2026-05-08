import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationErrorCode } from '../common/error-taxonomy';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService
  ) {}

  pipeline() {
    return {
      stages: [
        { id: 'pdf_ocr', description: 'Extract text from plan sheet PDFs using OCR.', status: 'infrastructure_ready' },
        { id: 'plan_note_summary', description: 'Summarize extracted plan notes into structured zoning rules.', status: 'infrastructure_ready' },
        { id: 'legend_classification', description: 'Classify plan legend colors/codes into standard zoning function categories.', status: 'infrastructure_ready' },
        { id: 'zoning_risk', description: 'Compute imar risk score from zoning rules, sit areas, expropriation, and suspension history.', status: 'infrastructure_ready' },
        { id: 'source_confidence', description: 'Score data freshness and source reliability.', status: 'infrastructure_ready' },
        { id: 'provenance', description: 'Track which source, connector run, and timestamp produced each data point.', status: 'infrastructure_ready' }
      ],
      storage: 'Artifacts stored in S3/MinIO; structured results in ai_analysis_runs table.',
      reviewPolicy: 'Low confidence outputs are marked requires_review.'
    };
  }

  async runs(limit = 50): Promise<unknown> {
    if (!this.db.isConfigured()) return { status: 'not_ready', issue: this.db.notConfiguredIssue() };

    const result = await this.db.query(
      `select id, source_id, analysis_type, input_reference, status, confidence_score,
              result_summary, result_payload, created_at, completed_at
       from ai_analysis_runs
       order by created_at desc limit $1`,
      [limit]
    );

    return { status: result.rowCount ? 'ok' : 'empty', count: result.rowCount, runs: result.rows };
  }

  async provenance(parcelId: string): Promise<unknown> {
    if (!this.db.isConfigured()) return { status: 'not_ready', issue: this.db.notConfiguredIssue() };

    const snapshots = await this.db.query(
      `select pzs.id, pzs.source_id, pzs.created_at,
              ds.name as source_name, ds.homepage_url as source_url,
              cr.id as connector_run_id, cr.started_at as connector_run_started, cr.status as connector_run_status
       from parcel_zoning_snapshots pzs
       join data_sources ds on ds.id = pzs.source_id
       left join connector_runs cr on cr.source_id = pzs.source_id
         and cr.started_at <= pzs.created_at
       where pzs.parcel_id = $1::uuid
       order by pzs.created_at desc`,
      [parcelId]
    );

    const analyses = await this.db.query(
      `select id, analysis_type, status, confidence_score, result_summary, created_at
       from ai_analysis_runs
       where input_reference = $1
       order by created_at desc`,
      [parcelId]
    );

    return {
      parcelId,
      dataSources: snapshots.rows,
      aiAnalyses: analyses.rows,
      explanation: 'Each data point traces back to a specific source, connector run, and timestamp. AI analysis results include confidence scores.'
    };
  }

  async parcelPotentialSummary(input: {
    parcelId?: string;
    parcelAreaM2?: number;
    emsal?: number;
    taks?: number;
    zoningFunction?: string;
    averageUnitM2?: number;
  }): Promise<unknown> {
    let payload = { ...input };

    if (input.parcelId && this.db.isConfigured()) {
      const result = await this.db.query(
        `select ST_Area(p.geom::geography) as parcel_area_m2,
                pzs.emsal, pzs.taks, zl.zoning_function
         from parcels p
         left join lateral (
           select * from parcel_zoning_snapshots pzs
           where pzs.parcel_id = p.id
           order by pzs.created_at desc
           limit 1
         ) pzs on true
         left join zoning_layers zl on zl.id = pzs.zoning_layer_id
         where p.id = $1::uuid`,
        [input.parcelId]
      );
      if ((result.rowCount ?? 0) > 0) {
        const row = result.rows[0] as Record<string, string | number | null>;
        payload = {
          ...payload,
          parcelAreaM2: Number(payload.parcelAreaM2 ?? row.parcel_area_m2 ?? 0),
          emsal: Number(payload.emsal ?? row.emsal ?? 0),
          taks: row.taks !== null && row.taks !== undefined ? Number(payload.taks ?? row.taks) : payload.taks,
          zoningFunction: String(payload.zoningFunction ?? row.zoning_function ?? 'unknown')
        };
      }
    }

    const parcelAreaM2 = Number(payload.parcelAreaM2 ?? 0);
    const emsal = Number(payload.emsal ?? 0);
    const taks = payload.taks !== undefined ? Number(payload.taks) : undefined;
    const averageUnitM2 = Number(payload.averageUnitM2 ?? 95);
    const grossBuildableM2 = parcelAreaM2 > 0 && emsal > 0 ? parcelAreaM2 * emsal : 0;
    const footprintM2 = taks && parcelAreaM2 > 0 ? parcelAreaM2 * taks : undefined;
    const estimatedFloors = footprintM2 && footprintM2 > 0 ? Math.ceil(grossBuildableM2 / footprintM2) : null;
    const estimatedUnits = grossBuildableM2 > 0 ? Math.max(1, Math.floor((grossBuildableM2 * 0.78) / averageUnitM2)) : 0;
    const parkingNeed = Math.ceil(estimatedUnits * 1.0);
    const zoning = (payload.zoningFunction || '').toLowerCase();
    const recommendedUse = zoning.includes('ticari')
      ? 'ticari'
      : zoning.includes('konut')
        ? 'konut'
        : 'karma';
    const riskScore = Math.min(
      100,
      Math.max(
        5,
        (emsal <= 0 ? 40 : 0) +
        (!taks ? 20 : 0) +
        (estimatedFloors && estimatedFloors > 12 ? 15 : 0) +
        (recommendedUse === 'karma' ? 10 : 0)
      )
    );

    return {
      status: grossBuildableM2 > 0 ? 'ok' : 'requires_data',
      summary: {
        maxBuildingType: recommendedUse === 'ticari' ? 'ticari_blok' : recommendedUse === 'konut' ? 'konut_blok' : 'karma_blok',
        estimatedFloors,
        estimatedIndependentUnits: estimatedUnits,
        estimatedParkingNeed: parkingNeed,
        recommendedUse,
        riskScore
      },
      assumptions: {
        averageUnitM2,
        netEfficiencyRatio: 0.78,
        parkingPerUnit: 1.0
      },
      provenance: {
        parcelId: input.parcelId ?? null,
        zoningFunction: payload.zoningFunction ?? null
      }
    };
  }

  async explainPlanNotes(input: {
    noteText: string;
    audience?: 'citizen' | 'architect' | 'investor';
    maxBullets?: number;
  }): Promise<unknown> {
    const noteText = (input.noteText || '').trim();
    if (!noteText) return { status: 'invalid_input', message: 'noteText is required.' };

    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      return {
        status: 'requires_credentials',
        issue: {
          code: IntegrationErrorCode.RequiresCredentials,
          message: 'OPENAI_API_KEY is not configured.'
        }
      };
    }

    const model = this.config.get<string>('OPENAI_MODEL') || 'gpt-4.1-mini';
    const bulletCount = Math.min(12, Math.max(4, input.maxBullets ?? 6));
    const audience = input.audience ?? 'citizen';

    const systemPrompt = 'You explain Turkish zoning plan notes in clear Turkish. Be accurate, concise, and avoid legal overclaiming.';
    const userPrompt = [
      `Hedef kitle: ${audience}.`,
      `Lütfen aşağıdaki imar notunu sade Türkçe ile açıkla.`,
      `JSON formatında dön: {"plainSummary": "...", "bullets": ["..."], "risks": ["..."], "uncertainties": ["..."]}.`,
      `Maksimum madde sayısı: ${bulletCount}.`,
      `İmar Notu:\n${noteText}`
    ].join('\n\n');

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        return {
          status: 'provider_error',
          provider: 'openai',
          httpStatus: response.status
        };
      }

      const json = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content;
      if (!content) return { status: 'provider_error', provider: 'openai', message: 'No content returned.' };

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = { plainSummary: content, bullets: [], risks: [], uncertainties: [] };
      }

      return {
        status: 'ok',
        provider: 'openai',
        model,
        explanation: parsed
      };
    } catch (error) {
      return {
        status: 'provider_error',
        provider: 'openai',
        message: String(error)
      };
    }
  }
}
