import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { ThuHoiController } from './thu-hoi.controller';
import { ThuHoiService } from './thu-hoi.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ThuHoiController],
  providers: [ThuHoiService],
  exports: [ThuHoiService],
})
export class ThuHoiModule {}
