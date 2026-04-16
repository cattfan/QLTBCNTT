import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { LichSuBanGiaoController } from './lich-su-ban-giao.controller';
import { LichSuBanGiaoService } from './lich-su-ban-giao.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LichSuBanGiaoController],
  providers: [LichSuBanGiaoService],
  exports: [LichSuBanGiaoService],
})
export class LichSuBanGiaoModule {}
