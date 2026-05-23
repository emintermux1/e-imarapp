import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UserDataService {
  constructor(private readonly db: DatabaseService) {}

  async recordHistory(input: Record<string, unknown>) {
    if (!this.db.isConfigured()) return { status: 'not_ready', issue: this.db.notConfiguredIssue() };
    return { status: 'not_ready', input };
  }

  async history(userReference: string) { return { status: 'not_ready', userReference, items: [] }; }
  async favorites(userReference: string) { return { status: 'not_ready', userReference, items: [] }; }
}
