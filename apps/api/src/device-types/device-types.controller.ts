import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DeviceTypesService } from './device-types.service';
import type { CreateDeviceTypeDto } from './dto/create-device-type.dto';
import type { ListDeviceTypesQueryDto } from './dto/list-device-types-query.dto';
import type { UpdateDeviceTypeDto } from './dto/update-device-type.dto';

@Controller('device-types')
export class DeviceTypesController {
  constructor(private readonly deviceTypesService: DeviceTypesService) {}

  @Get()
  listDeviceTypes(@Query() query: ListDeviceTypesQueryDto) {
    return this.deviceTypesService.listDeviceTypes(query);
  }

  @Get(':id')
  getDeviceType(@Param('id') id: string) {
    return this.deviceTypesService.getDeviceTypeById(id);
  }

  @Post()
  createDeviceType(@Body() payload: CreateDeviceTypeDto) {
    return this.deviceTypesService.createDeviceType(payload);
  }

  @Patch(':id')
  updateDeviceType(
    @Param('id') id: string,
    @Body() payload: UpdateDeviceTypeDto,
  ) {
    return this.deviceTypesService.updateDeviceType(id, payload);
  }

  @Delete(':id')
  deleteDeviceType(@Param('id') id: string) {
    return this.deviceTypesService.deleteDeviceType(id);
  }
}
