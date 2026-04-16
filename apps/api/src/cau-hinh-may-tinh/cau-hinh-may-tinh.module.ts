import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { CauHinhMayTinhController } from './cau-hinh-may-tinh.controller';
import { CauHinhMayTinhService } from './cau-hinh-may-tinh.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CauHinhMayTinhController],
  providers: [CauHinhMayTinhService],
  exports: [CauHinhMayTinhService],
})
export class CauHinhMayTinhModule {}
