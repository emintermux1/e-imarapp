import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EplanModule } from '../eplan/eplan.module';
import { AskiCompatController, PlansCompatController } from './plans-compat.controller';

@Module({
  imports: [DatabaseModule, EplanModule],
  controllers: [PlansCompatController, AskiCompatController]
})
export class PlansModule {}
