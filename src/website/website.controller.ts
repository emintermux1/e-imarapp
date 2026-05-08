import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParcelQueryDto } from '../parcels/dto/parcel-query.dto';
import { WebsiteService } from './website.service';

@ApiTags('website')
@Controller('website')
export class WebsiteController {
  constructor(private readonly website: WebsiteService) {}

  @Get('architecture')
  architecture() {
    return this.website.architecture();
  }

  @Get('bootstrap')
  bootstrap(@Query('userReference') userReference?: string) {
    return this.website.bootstrap(userReference);
  }

  @Post('session/start')
  startSession(@Body() body: { userReference: string; roles?: string[]; expiresInHours?: number }) {
    return this.website.startSession(body);
  }

  @Post('session/verify')
  verifySession(@Body() body: { token: string }) {
    return this.website.verifySession(body.token);
  }

  @Post('bff/parcel-workflow')
  parcelWorkflow(
    @Body() body: {
      userReference?: string;
      query: ParcelQueryDto;
      emsalInput?: {
        parcelAreaM2: number;
        emsal: number;
        taksRatio?: number;
        floorAreaPerUnitM2?: number;
        parkingPerUnit?: number;
        ownerShareRatio?: number;
        contractorShareRatio?: number;
        circulationLossRatio?: number;
      };
    }
  ) {
    return this.website.parcelWorkflow(body);
  }

  @Post('bff/plan-note-explain')
  planNoteExplain(
    @Body() body: {
      userReference?: string;
      noteText: string;
      audience?: 'citizen' | 'architect' | 'investor';
      maxBullets?: number;
    }
  ) {
    return this.website.planNoteExplain(body);
  }

  @Get('workspace/:userReference')
  workspace(@Param('userReference') userReference: string) {
    return this.website.workspace(userReference);
  }
}
