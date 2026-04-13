import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { OPERATING_SYSTEMS_STORAGE_FILE } from './operating-systems.constants';
import type {
  OperatingSystemDeviceRecord,
  OperatingSystemRecord,
  OperatingSystemsStorageState,
} from './operating-systems.types';

@Injectable()
export class OperatingSystemsStore implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.ensureStorageReady();
  }

  async getState(): Promise<OperatingSystemsStorageState> {
    await this.ensureStorageReady();
    return this.readStateFromDisk();
  }

  async listOperatingSystems(): Promise<OperatingSystemRecord[]> {
    const state = await this.getState();
    return state.operatingSystems;
  }

  async listDevices(): Promise<OperatingSystemDeviceRecord[]> {
    const state = await this.getState();
    return state.devices;
  }

  async findOperatingSystemById(
    id: string,
  ): Promise<OperatingSystemRecord | null> {
    const state = await this.getState();
    return (
      state.operatingSystems.find(
        (operatingSystem) => operatingSystem.id === id,
      ) ?? null
    );
  }

  async findOperatingSystemByCode(
    code: string,
  ): Promise<OperatingSystemRecord | null> {
    const normalizedCode = this.normalizeCode(code);
    const state = await this.getState();

    return (
      state.operatingSystems.find(
        (operatingSystem) =>
          this.normalizeCode(operatingSystem.code) === normalizedCode,
      ) ?? null
    );
  }

  async createOperatingSystem(
    payload: Omit<OperatingSystemRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<OperatingSystemRecord> {
    const state = await this.getState();
    const now = new Date().toISOString();
    const operatingSystem: OperatingSystemRecord = {
      id: randomUUID(),
      code: payload.code,
      name: payload.name,
      description: payload.description,
      createdAt: now,
      updatedAt: now,
    };

    state.operatingSystems.push(operatingSystem);
    await this.persistState(state);

    return operatingSystem;
  }

  async updateOperatingSystem(
    operatingSystemId: string,
    payload: Partial<
      Pick<OperatingSystemRecord, 'code' | 'name' | 'description'>
    >,
  ): Promise<OperatingSystemRecord> {
    const state = await this.getState();
    const operatingSystemIndex = state.operatingSystems.findIndex(
      (operatingSystem) => operatingSystem.id === operatingSystemId,
    );

    if (operatingSystemIndex === -1) {
      throw new InternalServerErrorException('Operating system not found');
    }

    const updatedOperatingSystem: OperatingSystemRecord = {
      ...state.operatingSystems[operatingSystemIndex],
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    state.operatingSystems[operatingSystemIndex] = updatedOperatingSystem;
    await this.persistState(state);

    return updatedOperatingSystem;
  }

  async deleteOperatingSystem(operatingSystemId: string): Promise<void> {
    const state = await this.getState();
    state.operatingSystems = state.operatingSystems.filter(
      (operatingSystem) => operatingSystem.id !== operatingSystemId,
    );
    await this.persistState(state);
  }

  async countLinkedDevices(operatingSystemId: string): Promise<number> {
    const state = await this.getState();
    return state.devices.filter(
      (device) => device.operatingSystemId === operatingSystemId,
    ).length;
  }

  private async ensureStorageReady(): Promise<void> {
    await mkdir(dirname(OPERATING_SYSTEMS_STORAGE_FILE), { recursive: true });

    try {
      await access(OPERATING_SYSTEMS_STORAGE_FILE);
      await this.readStateFromDisk();
    } catch (error) {
      if (!this.isMissingFileError(error)) {
        throw error;
      }

      await this.persistState({
        operatingSystems: [],
        devices: [],
      });
    }
  }

  private async readStateFromDisk(): Promise<OperatingSystemsStorageState> {
    const rawContent = await readFile(OPERATING_SYSTEMS_STORAGE_FILE, 'utf8');

    try {
      const parsedContent = JSON.parse(rawContent) as unknown;

      if (
        !this.isStorageState(parsedContent) ||
        !Array.isArray(parsedContent.operatingSystems) ||
        !Array.isArray(parsedContent.devices)
      ) {
        throw new InternalServerErrorException(
          'Operating systems storage format is invalid',
        );
      }

      return parsedContent;
    } catch {
      throw new InternalServerErrorException(
        'Operating systems storage format is invalid',
      );
    }
  }

  private async persistState(
    state: OperatingSystemsStorageState,
  ): Promise<void> {
    await mkdir(dirname(OPERATING_SYSTEMS_STORAGE_FILE), { recursive: true });
    await writeFile(
      OPERATING_SYSTEMS_STORAGE_FILE,
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

  private isStorageState(
    value: unknown,
  ): value is OperatingSystemsStorageState {
    return typeof value === 'object' && value !== null;
  }
}
