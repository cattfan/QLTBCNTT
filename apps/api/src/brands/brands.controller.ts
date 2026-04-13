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
import { BrandsService } from './brands.service';
import type { CreateBrandDto } from './dto/create-brand.dto';
import type { ListBrandsQueryDto } from './dto/list-brands-query.dto';
import type { UpdateBrandDto } from './dto/update-brand.dto';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  listBrands(@Query() query: ListBrandsQueryDto) {
    return this.brandsService.listBrands(query);
  }

  @Get(':id')
  getBrand(@Param('id') id: string) {
    return this.brandsService.getBrandById(id);
  }

  @Post()
  createBrand(@Body() payload: CreateBrandDto) {
    return this.brandsService.createBrand(payload);
  }

  @Patch(':id')
  updateBrand(@Param('id') id: string, @Body() payload: UpdateBrandDto) {
    return this.brandsService.updateBrand(id, payload);
  }

  @Delete(':id')
  deleteBrand(@Param('id') id: string) {
    return this.brandsService.deleteBrand(id);
  }
}
