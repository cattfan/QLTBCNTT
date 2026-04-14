import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { LoaiThietBiController } from './loai-thiet-bi.controller';
import { LoaiThietBiService } from './loai-thiet-bi.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LoaiThietBiController],
  providers: [LoaiThietBiService],
  exports: [LoaiThietBiService],
})
export class LoaiThietBiModule {}
