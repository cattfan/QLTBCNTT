import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { SuaChuaBaoTriController } from './sua-chua-bao-tri.controller';
import { SuaChuaBaoTriService } from './sua-chua-bao-tri.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SuaChuaBaoTriController],
  providers: [SuaChuaBaoTriService],
  exports: [SuaChuaBaoTriService],
})
export class SuaChuaBaoTriModule {}
