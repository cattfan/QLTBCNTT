import { Module } from '@nestjs/common';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { DepartmentsStore } from './departments.store';

@Module({
  controllers: [DepartmentsController],
  providers: [DepartmentsStore, DepartmentsService],
})
export class DepartmentsModule {}
