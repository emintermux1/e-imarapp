import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IntegrationErrorCode } from '../common/error-taxonomy';
import { DatabaseService } from '../database/database.service';

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly database: DatabaseService) {}

  @Get('suspensions')
  async suspensions(): Promise<unknown> {
    if (!this.database.isConfigured()) {
      return {
        status: 'not_ready',
        issue: this.database.notConfiguredIssue()
      };
    }

    const result = await this.database.query(
      `select id, source_id, municipality_id, title, announcement_url, published_at, objection_deadline, status
       from suspension_notices
       order by published_at desc nulls last
       limit 100`
    );

    return {
      status: result.rowCount ? 'ok' : 'unavailable',
      notices: result.rows,
      issue:
        result.rowCount === 0
          ? {
              code: IntegrationErrorCode.Unavailable,
              message: 'No real suspension notices have been ingested yet.'
            }
          : undefined
    };
  }
}
