import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ParcelQueryDto } from './dto/parcel-query.dto';

@Injectable()
export class ParcelsService {
  constructor(private readonly db: DatabaseService) {}

  async queryParcel(query: ParcelQueryDto): Promise<unknown> {
    if (!this.db.isConfigured()) return { status: 'not_ready', issue: this.db.notConfiguredIssue(), parcels: [], count: 0 };
    return { status: 'not_ready', issue: { message: 'Parcel SQL lookup requires a concrete query implementation for the selected source.' }, parcels: [], count: 0, query };
  }
}
