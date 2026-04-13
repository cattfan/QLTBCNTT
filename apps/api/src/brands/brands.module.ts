import { Module } from '@nestjs/common';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { BrandsStore } from './brands.store';

@Module({
  controllers: [BrandsController],
  providers: [BrandsStore, BrandsService],
})
export class BrandsModule {}
