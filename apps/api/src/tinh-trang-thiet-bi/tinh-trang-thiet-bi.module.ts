import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { TinhTrangThietBiController } from './tinh-trang-thiet-bi.controller';
import { TinhTrangThietBiService } from './tinh-trang-thiet-bi.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TinhTrangThietBiController],
  providers: [TinhTrangThietBiService],
  exports: [TinhTrangThietBiService],
})
export class TinhTrangThietBiModule {}
