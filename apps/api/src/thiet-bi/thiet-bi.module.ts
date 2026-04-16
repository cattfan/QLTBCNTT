import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { ThietBiController } from './thiet-bi.controller';
import { ThietBiService } from './thiet-bi.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ThietBiController],
  providers: [ThietBiService],
  exports: [ThietBiService],
})
export class ThietBiModule {}
