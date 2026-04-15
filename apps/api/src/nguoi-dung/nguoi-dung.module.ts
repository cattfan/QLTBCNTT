import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { ItOnlyGuard } from './it-only.guard';
import { NguoiDungController } from './nguoi-dung.controller';
import { NguoiDungService } from './nguoi-dung.service';

@Module({
  imports: [DatabaseModule],
  controllers: [NguoiDungController],
  providers: [NguoiDungService, ItOnlyGuard],
  exports: [NguoiDungService],
})
export class NguoiDungModule {}
