import { Module } from '@nestjs/common';
import { DeviceTypesController } from './device-types.controller';
import { DeviceTypesService } from './device-types.service';
import { DeviceTypesStore } from './device-types.store';

@Module({
  controllers: [DeviceTypesController],
  providers: [DeviceTypesStore, DeviceTypesService],
})
export class DeviceTypesModule {}
