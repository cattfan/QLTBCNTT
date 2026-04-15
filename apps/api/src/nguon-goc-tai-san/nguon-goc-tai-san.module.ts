import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { NguonGocTaiSanController } from './nguon-goc-tai-san.controller';
import { NguonGocTaiSanService } from './nguon-goc-tai-san.service';

@Module({
  imports: [DatabaseModule],
  controllers: [NguonGocTaiSanController],
  providers: [NguonGocTaiSanService],
  exports: [NguonGocTaiSanService],
})
export class NguonGocTaiSanModule {}
