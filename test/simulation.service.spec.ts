import { SimulationService } from '../src/simulation/simulation.service';
import { DatabaseService } from '../src/database/database.service';

describe('SimulationService', () => {
  it('calculates emsal/share outputs', () => {
    const service = new SimulationService({} as DatabaseService);
    const result = service.calculateEmsalShare({
      parcelAreaM2: 500,
      emsal: 0.8,
      taksRatio: 0.4,
      ownerShareRatio: 0.5,
      contractorShareRatio: 0.5
    }) as { status: string; output: { totalConstructionAreaM2: number; estimatedParkingNeed: number } };

    expect(result.status).toBe('ok');
    expect(result.output.totalConstructionAreaM2).toBe(400);
    expect(result.output.estimatedParkingNeed).toBeGreaterThan(0);
  });
});
