import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { BanGiaoController } from './ban-giao.controller';
import { BanGiaoService } from './ban-giao.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BanGiaoController],
  providers: [BanGiaoService],
  exports: [BanGiaoService],
})
export class BanGiaoModule {}
