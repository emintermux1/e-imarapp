import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserDataService } from './user-data.service';

@ApiTags('user-data')
@Controller('user-data')
export class UserDataController {
  constructor(private readonly userData: UserDataService) {}

  @Get(':userReference/history')
  history(@Param('userReference') userReference: string) { return this.userData.history(userReference); }

  @Get(':userReference/favorites')
  favorites(@Param('userReference') userReference: string) { return this.userData.favorites(userReference); }
}
