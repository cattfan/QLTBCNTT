import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { HeDieuHanhController } from './he-dieu-hanh.controller';
import { HeDieuHanhService } from './he-dieu-hanh.service';

@Module({
  imports: [DatabaseModule],
  controllers: [HeDieuHanhController],
  providers: [HeDieuHanhService],
  exports: [HeDieuHanhService],
})
export class HeDieuHanhModule {}
