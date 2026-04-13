import { Module } from '@nestjs/common';
import { ModelsController } from './models.controller';
import { ModelsService } from './models.service';
import { ModelsStore } from './models.store';

@Module({
  controllers: [ModelsController],
  providers: [ModelsStore, ModelsService],
})
export class ModelsModule {}
