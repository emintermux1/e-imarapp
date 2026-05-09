import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  @Get('status')
  status() { return { status: 'not_ready', note: 'Configure Redis/BullMQ workers for job execution.' }; }
}
