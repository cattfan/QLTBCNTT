import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseCrudService } from '../common/base-crud.service';
import type { CreateBrandDto } from './dto/create-brand.dto';
import type { ListBrandsQueryDto } from './dto/list-brands-query.dto';
import type { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandsStore } from './brands.store';
import type { BrandListItem, BrandRecord } from './brands.types';

@Injectable()
export class BrandsService extends BaseCrudService {
  constructor(private readonly brandsStore: BrandsStore) {
    super();
  }

  async listBrands(query: ListBrandsQueryDto) {
    const brands = await this.brandsStore.listBrands();
    const devices = await this.brandsStore.listDevices();

    const items: BrandListItem[] = brands.map((brand) => ({
      ...brand,
      deviceCount: devices.filter((device) => device.brandId === brand.id)
        .length,
    }));

    return this.buildPaginatedSearchResult(items, query, {
      matchesSearch: (brand, normalizedSearch) =>
        brand.name.toLowerCase().includes(normalizedSearch),
      sort: (left, right) => left.code.localeCompare(right.code),
    });
  }

  async getBrandById(brandId: string) {
    const brand = await this.brandsStore.findBrandById(brandId);

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const deviceCount = await this.brandsStore.countLinkedDevices(brandId);

    return {
      brand: {
        ...brand,
        deviceCount,
      },
    };
  }

  async createBrand(payload: CreateBrandDto) {
    const preparedPayload = await this.prepareBrandPayload(payload);
    const brand = await this.brandsStore.createBrand(preparedPayload);

    return {
      message: 'Brand created successfully',
      brand,
    };
  }

  async updateBrand(brandId: string, payload: UpdateBrandDto) {
    const existingBrand = await this.brandsStore.findBrandById(brandId);

    if (!existingBrand) {
      throw new NotFoundException('Brand not found');
    }

    const preparedPayload = await this.prepareBrandPayload(payload, {
      allowPartial: true,
      currentBrand: existingBrand,
    });

    const brand = await this.brandsStore.updateBrand(brandId, preparedPayload);

    return {
      message: 'Brand updated successfully',
      brand,
    };
  }

  async deleteBrand(brandId: string) {
    const brand = await this.brandsStore.findBrandById(brandId);

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const deviceCount = await this.brandsStore.countLinkedDevices(brandId);

    if (deviceCount > 0) {
      throw new ConflictException(
        'Cannot delete brand while devices are linked',
      );
    }

    await this.brandsStore.deleteBrand(brandId);

    return {
      message: 'Brand deleted successfully',
    };
  }

  private async prepareBrandPayload(
    payload: CreateBrandDto | UpdateBrandDto,
    options?: {
      allowPartial?: boolean;
      currentBrand?: BrandRecord;
    },
  ): Promise<{
    code: string;
    name: string;
    description: string;
  }> {
    const currentBrand = options?.currentBrand;
    const allowPartial = options?.allowPartial ?? false;

    const code = this.resolveRequiredText(
      payload.code,
      currentBrand?.code,
      allowPartial,
      'code',
    );
    const name = this.resolveRequiredText(
      payload.name,
      currentBrand?.name,
      allowPartial,
      'name',
    );
    const description = this.resolveOptionalText(
      payload.description,
      currentBrand?.description,
    );

    const brandWithSameCode = await this.brandsStore.findBrandByCode(code);

    if (brandWithSameCode && brandWithSameCode.id !== currentBrand?.id) {
      throw new ConflictException('Brand code already exists');
    }

    return {
      code: code.toUpperCase(),
      name,
      description,
    };
  }
}
