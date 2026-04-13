import { Module } from '@nestjs/common';
import { OperatingSystemsController } from './operating-systems.controller';
import { OperatingSystemsService } from './operating-systems.service';
import { OperatingSystemsStore } from './operating-systems.store';

@Module({
  controllers: [OperatingSystemsController],
  providers: [OperatingSystemsStore, OperatingSystemsService],
})
export class OperatingSystemsModule {}
