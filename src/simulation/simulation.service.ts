import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

interface EmsalShareInput {
  parcelAreaM2: number;
  emsal: number;
  taksRatio?: number;
  floorAreaPerUnitM2?: number;
  parkingPerUnit?: number;
  ownerShareRatio?: number;
  contractorShareRatio?: number;
  circulationLossRatio?: number;
}

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

  calculateEmsalShare(input: EmsalShareInput): unknown {
    const parcelAreaM2 = Number(input.parcelAreaM2 || 0);
    const emsal = Number(input.emsal || 0);
    const taksRatio = input.taksRatio !== undefined ? Number(input.taksRatio) : null;
    const floorAreaPerUnitM2 = Number(input.floorAreaPerUnitM2 ?? 100);
    const parkingPerUnit = Number(input.parkingPerUnit ?? 1);
    const circulationLossRatio = Number(input.circulationLossRatio ?? 0.2);
    const ownerShareRatio = Number(input.ownerShareRatio ?? 0.5);
    const contractorShareRatio = Number(input.contractorShareRatio ?? 0.5);

    if (parcelAreaM2 <= 0 || emsal <= 0) {
      return { status: 'invalid_input', message: 'parcelAreaM2 and emsal must be greater than zero.' };
    }

    const totalConstructionAreaM2 = parcelAreaM2 * emsal;
    const netSellableAreaM2 = totalConstructionAreaM2 * (1 - circulationLossRatio);
    const maxFootprintM2 = taksRatio ? parcelAreaM2 * taksRatio : null;
    const estimatedFloors = maxFootprintM2 && maxFootprintM2 > 0
      ? Math.ceil(totalConstructionAreaM2 / maxFootprintM2)
      : null;
    const estimatedIndependentUnits = Math.max(1, Math.floor(netSellableAreaM2 / floorAreaPerUnitM2));
    const estimatedParkingNeed = Math.ceil(estimatedIndependentUnits * parkingPerUnit);

    const ownerNetAreaM2 = netSellableAreaM2 * ownerShareRatio;
    const contractorNetAreaM2 = netSellableAreaM2 * contractorShareRatio;

    return {
      status: 'ok',
      inputs: {
        parcelAreaM2, emsal, taksRatio, floorAreaPerUnitM2, parkingPerUnit, circulationLossRatio,
        ownerShareRatio, contractorShareRatio
      },
      output: {
        totalConstructionAreaM2,
        netSellableAreaM2,
        maxFootprintM2,
        estimatedFloors,
        estimatedIndependentUnits,
        estimatedParkingNeed,
        shareBreakdown: {
          ownerNetAreaM2,
          contractorNetAreaM2
        }
      },
      note: 'Values are engineering estimates and must be validated with current plan notes, municipality constraints, and official licenses.'
    };
  }

  checkCompliance(input: {
    parcel_id?: number;
    parcel_area_m2?: number;
    emsal?: number;
    kaks?: number;
    taks?: number;
    gabari_m?: number;
    floors?: number;
    floor_height_m?: number;
    geometry?: unknown;
  }): unknown {
    const area = Number(input.parcel_area_m2 ?? 0);
    const emsal = Number(input.kaks ?? input.emsal ?? 0);
    const taks = Number(input.taks ?? 0);
    const gabari = Number(input.gabari_m ?? 0);
    const floors = Number(input.floors ?? 0);
    const floorHeight = Number(input.floor_height_m ?? 3);

    if (area <= 0 || emsal <= 0) {
      return {
        status: 'invalid_input',
        compliant: false,
        is_compliant: false,
        violations: ['Parsel alanı ve emsal/KAKS değerleri sıfırdan büyük olmalıdır.'],
        warnings: []
      };
    }

    const maxConstructionAreaM2 = area * emsal;
    const maxFootprintM2 = taks > 0 ? area * taks : null;
    const violations: string[] = [];
    const warnings: string[] = [];

    if (maxFootprintM2 && floors > 0) {
      const estimatedBuiltArea = maxFootprintM2 * floors;
      if (estimatedBuiltArea > maxConstructionAreaM2 * 1.08) {
        violations.push(
          `Taban alanı × kat sayısı (${Math.round(estimatedBuiltArea)} m²) hesaplanan toplam inşaat alanını (${Math.round(maxConstructionAreaM2)} m²) aşıyor.`
        );
      }
    }

    if (gabari > 0 && floorHeight > 0 && floors > 0) {
      const totalHeight = floors * floorHeight;
      if (totalHeight > gabari * 1.05) {
        violations.push(
          `Toplam bina yüksekliği (${totalHeight.toFixed(1)} m) gabari sınırını (${gabari.toFixed(1)} m) aşıyor.`
        );
      }
    }

    if (!input.geometry) {
      warnings.push('Geometri gönderilmedi; yalnızca alan/emsal/taks/gabari kuralları kontrol edildi.');
    }

    const compliant = violations.length === 0;
    return {
      status: 'ok',
      compliant,
      is_compliant: compliant,
      parcel_id: input.parcel_id ?? null,
      summary: {
        parcel_area_m2: area,
        max_construction_area_m2: maxConstructionAreaM2,
        max_footprint_m2: maxFootprintM2,
        floors,
        gabari_m: gabari || null
      },
      violations,
      warnings,
      note: 'Bu kontrol mühendislik ön doğrulamasıdır; resmi imar durumu yerine geçmez.'
    };
  }
}
