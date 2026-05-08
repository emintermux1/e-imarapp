import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UserDataService {
  constructor(private readonly db: DatabaseService) {}

  async recordHistory(body: { userReference: string; queryType: string; queryPayload: Record<string, unknown>; resultCount?: number }): Promise<unknown> {
    if (!this.db.isConfigured()) return { status: 'not_ready', issue: this.db.notConfiguredIssue() };
    const result = await this.db.query(
      `insert into parcel_query_history (user_reference, query_type, query_payload, result_count)
       values ($1, $2, $3, $4) returning id, created_at`,
      [body.userReference, body.queryType, JSON.stringify(body.queryPayload), body.resultCount ?? null]
    );
    return { status: 'ok', history: result.rows[0] };
  }

  async history(userReference: string): Promise<unknown> {
    if (!this.db.isConfigured()) return { status: 'not_ready', issue: this.db.notConfiguredIssue() };
    const result = await this.db.query(
      `select id, query_type, query_payload, result_count, created_at
       from parcel_query_history where user_reference = $1 order by created_at desc limit 100`,
      [userReference]
    );
    return { userReference, history: result.rows };
  }

  async saveItem(body: { userReference: string; itemType: string; itemReference: string; label?: string; metadata?: Record<string, unknown> }): Promise<unknown> {
    if (!this.db.isConfigured()) return { status: 'not_ready', issue: this.db.notConfiguredIssue() };
    const result = await this.db.query(
      `insert into user_saved_items (user_reference, item_type, item_reference, label, metadata)
       values ($1, $2, $3, $4, $5)
       on conflict (user_reference, item_type, item_reference) do update set
         label = excluded.label, metadata = excluded.metadata
       returning *`,
      [body.userReference, body.itemType, body.itemReference, body.label ?? null, JSON.stringify(body.metadata ?? {})]
    );
    return { status: 'ok', item: result.rows[0] };
  }

  async favorites(userReference: string): Promise<unknown> {
    if (!this.db.isConfigured()) return { status: 'not_ready', issue: this.db.notConfiguredIssue() };
    const result = await this.db.query(
      `select * from user_saved_items where user_reference = $1 order by created_at desc`,
      [userReference]
    );
    return { userReference, favorites: result.rows };
  }
}
