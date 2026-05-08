import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserDataService } from './user-data.service';

@ApiTags('user-data')
@Controller('users')
export class UserDataController {
  constructor(private readonly userData: UserDataService) {}

  @Post('history')
  recordHistory(@Body() body: Parameters<UserDataService['recordHistory']>[0]): Promise<unknown> {
    return this.userData.recordHistory(body);
  }

  @Get(':userReference/history')
  history(@Param('userReference') userReference: string): Promise<unknown> {
    return this.userData.history(userReference);
  }

  @Post('favorites')
  saveItem(@Body() body: Parameters<UserDataService['saveItem']>[0]): Promise<unknown> {
    return this.userData.saveItem(body);
  }

  @Get(':userReference/favorites')
  favorites(@Param('userReference') userReference: string): Promise<unknown> {
    return this.userData.favorites(userReference);
  }
}
