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
import { OperatingSystemsService } from './operating-systems.service';
import type { CreateOperatingSystemDto } from './dto/create-operating-system.dto';
import type { ListOperatingSystemsQueryDto } from './dto/list-operating-systems-query.dto';
import type { UpdateOperatingSystemDto } from './dto/update-operating-system.dto';

@Controller('operating-systems')
export class OperatingSystemsController {
  constructor(
    private readonly operatingSystemsService: OperatingSystemsService,
  ) {}

  @Get()
  listOperatingSystems(@Query() query: ListOperatingSystemsQueryDto) {
    return this.operatingSystemsService.listOperatingSystems(query);
  }

  @Get(':id')
  getOperatingSystem(@Param('id') id: string) {
    return this.operatingSystemsService.getOperatingSystemById(id);
  }

  @Post()
  createOperatingSystem(@Body() payload: CreateOperatingSystemDto) {
    return this.operatingSystemsService.createOperatingSystem(payload);
  }

  @Patch(':id')
  updateOperatingSystem(
    @Param('id') id: string,
    @Body() payload: UpdateOperatingSystemDto,
  ) {
    return this.operatingSystemsService.updateOperatingSystem(id, payload);
  }

  @Delete(':id')
  deleteOperatingSystem(@Param('id') id: string) {
    return this.operatingSystemsService.deleteOperatingSystem(id);
  }
}
