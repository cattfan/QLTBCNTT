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
import { DepartmentsService } from './departments.service';
import type { CreateDepartmentDto } from './dto/create-department.dto';
import type { ListDepartmentsQueryDto } from './dto/list-departments-query.dto';
import type { UpdateDepartmentDto } from './dto/update-department.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  listDepartments(@Query() query: ListDepartmentsQueryDto) {
    return this.departmentsService.listDepartments(query);
  }

  @Get(':id')
  getDepartment(@Param('id') id: string) {
    return this.departmentsService.getDepartmentById(id);
  }

  @Post()
  createDepartment(@Body() payload: CreateDepartmentDto) {
    return this.departmentsService.createDepartment(payload);
  }

  @Patch(':id')
  updateDepartment(
    @Param('id') id: string,
    @Body() payload: UpdateDepartmentDto,
  ) {
    return this.departmentsService.updateDepartment(id, payload);
  }

  @Delete(':id')
  deleteDepartment(@Param('id') id: string) {
    return this.departmentsService.deleteDepartment(id);
  }
}
