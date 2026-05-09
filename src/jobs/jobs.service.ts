import { Injectable } from '@nestjs/common';

@Injectable()
export class JobsService {
  async enqueue(name: string, payload: Record<string, unknown>) {
    return {
      status: 'queued_metadata_only',
      name,
      payload,
      schedule: name === 'geo.integrity.daily' ? { cadence: 'daily', mode: 'metadata_only_until_worker_configured' } : undefined,
      note: 'Queue backend is not configured in this minimal runtime; no external job was dispatched.'
    };
  }
}
