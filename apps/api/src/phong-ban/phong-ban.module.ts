import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { PhongBanController } from './phong-ban.controller';
import { PhongBanService } from './phong-ban.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PhongBanController],
  providers: [PhongBanService],
  exports: [PhongBanService],
})
export class PhongBanModule {}
