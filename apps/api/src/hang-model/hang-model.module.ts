import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { HangModelController } from './hang-model.controller';
import { HangModelService } from './hang-model.service';

@Module({
  imports: [DatabaseModule],
  controllers: [HangModelController],
  providers: [HangModelService],
  exports: [HangModelService],
})
export class HangModelModule {}
