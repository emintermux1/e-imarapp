import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PlansController } from './plans.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [PlansController]
})
export class PlansModule {}
