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
import { ModelsService } from './models.service';
import type { CreateModelDto } from './dto/create-model.dto';
import type { ListModelsQueryDto } from './dto/list-models-query.dto';
import type { UpdateModelDto } from './dto/update-model.dto';

@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  listModels(@Query() query: ListModelsQueryDto) {
    return this.modelsService.listModels(query);
  }

  @Get(':id')
  getModel(@Param('id') id: string) {
    return this.modelsService.getModelById(id);
  }

  @Post()
  createModel(@Body() payload: CreateModelDto) {
    return this.modelsService.createModel(payload);
  }

  @Patch(':id')
  updateModel(@Param('id') id: string, @Body() payload: UpdateModelDto) {
    return this.modelsService.updateModel(id, payload);
  }

  @Delete(':id')
  deleteModel(@Param('id') id: string) {
    return this.modelsService.deleteModel(id);
  }
}
