import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UserDataController } from './user-data.controller';
import { UserDataService } from './user-data.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UserDataController],
  providers: [UserDataService]
})
export class UserDataModule {}
