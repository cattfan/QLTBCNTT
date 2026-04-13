import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DEVICE_TYPES_STORAGE_FILE } from './device-types.constants';
import type {
  DeviceRecord,
  DeviceTypeRecord,
  DeviceTypesStorageState,
} from './device-types.types';

@Injectable()
export class DeviceTypesStore implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.ensureStorageReady();
  }

  async getState(): Promise<DeviceTypesStorageState> {
    await this.ensureStorageReady();
    return this.readStateFromDisk();
  }

  async listDeviceTypes(): Promise<DeviceTypeRecord[]> {
    const state = await this.getState();
    return state.deviceTypes;
  }

  async listDevices(): Promise<DeviceRecord[]> {
    const state = await this.getState();
    return state.devices;
  }

  async findDeviceTypeById(id: string): Promise<DeviceTypeRecord | null> {
    const state = await this.getState();
    return state.deviceTypes.find((deviceType) => deviceType.id === id) ?? null;
  }

  async findDeviceTypeByCode(code: string): Promise<DeviceTypeRecord | null> {
    const normalizedCode = this.normalizeCode(code);
    const state = await this.getState();

    return (
      state.deviceTypes.find(
        (deviceType) => this.normalizeCode(deviceType.code) === normalizedCode,
      ) ?? null
    );
  }

  async createDeviceType(
    payload: Omit<DeviceTypeRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<DeviceTypeRecord> {
    const state = await this.getState();
    const now = new Date().toISOString();
    const deviceType: DeviceTypeRecord = {
      id: randomUUID(),
      code: payload.code,
      name: payload.name,
      description: payload.description,
      createdAt: now,
      updatedAt: now,
    };

    state.deviceTypes.push(deviceType);
    await this.persistState(state);

    return deviceType;
  }

  async updateDeviceType(
    deviceTypeId: string,
    payload: Partial<Pick<DeviceTypeRecord, 'code' | 'name' | 'description'>>,
  ): Promise<DeviceTypeRecord> {
    const state = await this.getState();
    const deviceTypeIndex = state.deviceTypes.findIndex(
      (deviceType) => deviceType.id === deviceTypeId,
    );

    if (deviceTypeIndex === -1) {
      throw new InternalServerErrorException('Device type not found');
    }

    const updatedDeviceType: DeviceTypeRecord = {
      ...state.deviceTypes[deviceTypeIndex],
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    state.deviceTypes[deviceTypeIndex] = updatedDeviceType;
    await this.persistState(state);

    return updatedDeviceType;
  }

  async deleteDeviceType(deviceTypeId: string): Promise<void> {
    const state = await this.getState();
    state.deviceTypes = state.deviceTypes.filter(
      (deviceType) => deviceType.id !== deviceTypeId,
    );
    await this.persistState(state);
  }

  async countLinkedDevices(deviceTypeId: string): Promise<number> {
    const state = await this.getState();

    return state.devices.filter((device) => device.typeId === deviceTypeId)
      .length;
  }

  private async ensureStorageReady(): Promise<void> {
    await mkdir(dirname(DEVICE_TYPES_STORAGE_FILE), { recursive: true });

    try {
      await access(DEVICE_TYPES_STORAGE_FILE);
      await this.readStateFromDisk();
    } catch (error) {
      if (!this.isMissingFileError(error)) {
        throw error;
      }

      await this.persistState({
        deviceTypes: [],
        devices: [],
      });
    }
  }

  private async readStateFromDisk(): Promise<DeviceTypesStorageState> {
    const rawContent = await readFile(DEVICE_TYPES_STORAGE_FILE, 'utf8');

    try {
      const parsedContent = JSON.parse(rawContent) as unknown;

      if (
        !this.isStorageState(parsedContent) ||
        !Array.isArray(parsedContent.deviceTypes) ||
        !Array.isArray(parsedContent.devices)
      ) {
        throw new InternalServerErrorException(
          'Device types storage format is invalid',
        );
      }

      return parsedContent;
    } catch {
      throw new InternalServerErrorException(
        'Device types storage format is invalid',
      );
    }
  }

  private async persistState(state: DeviceTypesStorageState): Promise<void> {
    await mkdir(dirname(DEVICE_TYPES_STORAGE_FILE), { recursive: true });
    await writeFile(
      DEVICE_TYPES_STORAGE_FILE,
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

  private isStorageState(value: unknown): value is DeviceTypesStorageState {
    return typeof value === 'object' && value !== null;
  }
}
