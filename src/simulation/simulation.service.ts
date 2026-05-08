import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SimulationService {
  constructor(private readonly db: DatabaseService) {}

  async buildingEnvelope(parcelId: string, userReference?: string): Promise<unknown> {
    if (!this.db.isConfigured()) return { status: 'not_ready', issue: this.db.notConfiguredIssue() };

    const result = await this.db.query(
      `select p.id as parcel_id,
              ST_Area(p.geom::geography) as parcel_area_m2,
              pzs.emsal, pzs.taks, pzs.kaks, pzs.gabari, pzs.building_height,
              pzs.approach_rules, zl.zoning_function, pl.title as plan_title
       from parcels p
       left join lateral (
         select * from parcel_zoning_snapshots pzs
         where pzs.parcel_id = p.id
         order by pzs.created_at desc
         limit 1
       ) pzs on true
       left join zoning_layers zl on zl.id = pzs.zoning_layer_id
       left join plans pl on pl.id = pzs.plan_id
       where p.id = $1::uuid`,
      [parcelId]
    );

    if (result.rowCount === 0) return { status: 'not_found', parcelId };
    const row = result.rows[0] as Record<string, number | string | null | object>;
    const area = Number(row.parcel_area_m2 ?? 0);
    const emsal = row.emsal ? Number(row.emsal) : null;
    const taks = row.taks ? Number(row.taks) : null;
    const envelope = {
      parcelAreaM2: area,
      maxConstructionAreaM2: emsal ? area * emsal : null,
      maxFootprintM2: taks ? area * taks : null,
      emsal,
      taks,
      kaks: row.kaks,
      gabari: row.gabari,
      buildingHeight: row.building_height,
      approachRules: row.approach_rules,
      zoningFunction: row.zoning_function,
      planTitle: row.plan_title
    };

    await this.db.query(
      `insert into building_simulation_runs (user_reference, parcel_id, envelope, status)
       values ($1, $2::uuid, $3, 'computed')`,
      [userReference ?? null, parcelId, JSON.stringify(envelope)]
    );

    return { status: 'ok', parcelId, envelope };
  }

  async mergeCandidates(parcelId: string): Promise<unknown> {
    if (!this.db.isConfigured()) return { status: 'not_ready', issue: this.db.notConfiguredIssue() };

    const result = await this.db.query(
      `select p2.id as adjacent_parcel_id, p2.ada, p2.parsel_no,
              ST_Area(ST_Union(p1.geom, p2.geom)::geography) as combined_area_m2,
              ST_AsGeoJSON(p2.geom)::json as geometry
       from parcels p1
       join parcels p2 on p1.id <> p2.id and ST_Touches(p1.geom, p2.geom)
       where p1.id = $1::uuid
       order by combined_area_m2 desc
       limit 25`,
      [parcelId]
    );

    return {
      status: result.rowCount ? 'ok' : 'empty',
      parcelId,
      candidates: result.rows,
      note: 'These are adjacent geometry candidates. Legal ownership/merger feasibility must be verified from official records.'
    };
  }
}
