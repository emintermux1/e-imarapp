import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post('request')
  request(@Body() body: Parameters<ReportsService['requestReport']>[0]) {
    return this.reports.requestReport(body);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.reports.getReport(id);
  }
}
