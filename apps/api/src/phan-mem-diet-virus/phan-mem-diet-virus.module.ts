import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { PhanMemDietVirusController } from './phan-mem-diet-virus.controller';
import { PhanMemDietVirusService } from './phan-mem-diet-virus.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PhanMemDietVirusController],
  providers: [PhanMemDietVirusService],
  exports: [PhanMemDietVirusService],
})
export class PhanMemDietVirusModule {}
