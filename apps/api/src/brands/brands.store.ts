import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { BRANDS_STORAGE_FILE } from './brands.constants';
import type {
  BrandDeviceRecord,
  BrandRecord,
  BrandsStorageState,
} from './brands.types';

@Injectable()
export class BrandsStore implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.ensureStorageReady();
  }

  async getState(): Promise<BrandsStorageState> {
    await this.ensureStorageReady();
    return this.readStateFromDisk();
  }

  async listBrands(): Promise<BrandRecord[]> {
    const state = await this.getState();
    return state.brands;
  }

  async listDevices(): Promise<BrandDeviceRecord[]> {
    const state = await this.getState();
    return state.devices;
  }

  async findBrandById(id: string): Promise<BrandRecord | null> {
    const state = await this.getState();
    return state.brands.find((brand) => brand.id === id) ?? null;
  }

  async findBrandByCode(code: string): Promise<BrandRecord | null> {
    const normalizedCode = this.normalizeCode(code);
    const state = await this.getState();

    return (
      state.brands.find(
        (brand) => this.normalizeCode(brand.code) === normalizedCode,
      ) ?? null
    );
  }

  async createBrand(
    payload: Omit<BrandRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<BrandRecord> {
    const state = await this.getState();
    const now = new Date().toISOString();
    const brand: BrandRecord = {
      id: randomUUID(),
      code: payload.code,
      name: payload.name,
      description: payload.description,
      createdAt: now,
      updatedAt: now,
    };

    state.brands.push(brand);
    await this.persistState(state);

    return brand;
  }

  async updateBrand(
    brandId: string,
    payload: Partial<Pick<BrandRecord, 'code' | 'name' | 'description'>>,
  ): Promise<BrandRecord> {
    const state = await this.getState();
    const brandIndex = state.brands.findIndex((brand) => brand.id === brandId);

    if (brandIndex === -1) {
      throw new InternalServerErrorException('Brand not found');
    }

    const updatedBrand: BrandRecord = {
      ...state.brands[brandIndex],
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    state.brands[brandIndex] = updatedBrand;
    await this.persistState(state);

    return updatedBrand;
  }

  async deleteBrand(brandId: string): Promise<void> {
    const state = await this.getState();
    state.brands = state.brands.filter((brand) => brand.id !== brandId);
    await this.persistState(state);
  }

  async countLinkedDevices(brandId: string): Promise<number> {
    const state = await this.getState();
    return state.devices.filter((device) => device.brandId === brandId).length;
  }

  private async ensureStorageReady(): Promise<void> {
    await mkdir(dirname(BRANDS_STORAGE_FILE), { recursive: true });

    try {
      await access(BRANDS_STORAGE_FILE);
      await this.readStateFromDisk();
    } catch (error) {
      if (!this.isMissingFileError(error)) {
        throw error;
      }

      await this.persistState({
        brands: [],
        devices: [],
      });
    }
  }

  private async readStateFromDisk(): Promise<BrandsStorageState> {
    const rawContent = await readFile(BRANDS_STORAGE_FILE, 'utf8');

    try {
      const parsedContent = JSON.parse(rawContent) as unknown;

      if (
        !this.isStorageState(parsedContent) ||
        !Array.isArray(parsedContent.brands) ||
        !Array.isArray(parsedContent.devices)
      ) {
        throw new InternalServerErrorException(
          'Brands storage format is invalid',
        );
      }

      return parsedContent;
    } catch {
      throw new InternalServerErrorException(
        'Brands storage format is invalid',
      );
    }
  }

  private async persistState(state: BrandsStorageState): Promise<void> {
    await mkdir(dirname(BRANDS_STORAGE_FILE), { recursive: true });
    await writeFile(
      BRANDS_STORAGE_FILE,
      JSON.stringify(state, null, 2),
      'utf8',
    );
  }

  private normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }

  private isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    );
  }

  private isStorageState(value: unknown): value is BrandsStorageState {
    return typeof value === 'object' && value !== null;
  }
}
