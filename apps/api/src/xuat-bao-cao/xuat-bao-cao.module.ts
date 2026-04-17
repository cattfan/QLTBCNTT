import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { XuatBaoCaoController } from './xuat-bao-cao.controller';
import { XuatBaoCaoService } from './xuat-bao-cao.service';

@Module({
  imports: [DatabaseModule],
  controllers: [XuatBaoCaoController],
  providers: [XuatBaoCaoService],
})
export class XuatBaoCaoModule {}
