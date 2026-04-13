import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { MODELS_STORAGE_FILE } from './models.constants';
import type {
  ModelDeviceRecord,
  ModelRecord,
  ModelsStorageState,
} from './models.types';

@Injectable()
export class ModelsStore implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.ensureStorageReady();
  }

  async getState(): Promise<ModelsStorageState> {
    await this.ensureStorageReady();
    return this.readStateFromDisk();
  }

  async listModels(): Promise<ModelRecord[]> {
    const state = await this.getState();
    return state.models;
  }

  async listDevices(): Promise<ModelDeviceRecord[]> {
    const state = await this.getState();
    return state.devices;
  }

  async findModelById(id: string): Promise<ModelRecord | null> {
    const state = await this.getState();
    return state.models.find((model) => model.id === id) ?? null;
  }

  async findModelByCode(code: string): Promise<ModelRecord | null> {
    const normalizedCode = this.normalizeCode(code);
    const state = await this.getState();

    return (
      state.models.find(
        (model) => this.normalizeCode(model.code) === normalizedCode,
      ) ?? null
    );
  }

  async createModel(
    payload: Omit<ModelRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ModelRecord> {
    const state = await this.getState();
    const now = new Date().toISOString();
    const model: ModelRecord = {
      id: randomUUID(),
      code: payload.code,
      name: payload.name,
      description: payload.description,
      createdAt: now,
      updatedAt: now,
    };

    state.models.push(model);
    await this.persistState(state);

    return model;
  }

  async updateModel(
    modelId: string,
    payload: Partial<Pick<ModelRecord, 'code' | 'name' | 'description'>>,
  ): Promise<ModelRecord> {
    const state = await this.getState();
    const modelIndex = state.models.findIndex((model) => model.id === modelId);

    if (modelIndex === -1) {
      throw new InternalServerErrorException('Model not found');
    }

    const updatedModel: ModelRecord = {
      ...state.models[modelIndex],
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    state.models[modelIndex] = updatedModel;
    await this.persistState(state);

    return updatedModel;
  }

  async deleteModel(modelId: string): Promise<void> {
    const state = await this.getState();
    state.models = state.models.filter((model) => model.id !== modelId);
    await this.persistState(state);
  }

  async countLinkedDevices(modelId: string): Promise<number> {
    const state = await this.getState();
    return state.devices.filter((device) => device.modelId === modelId).length;
  }

  private async ensureStorageReady(): Promise<void> {
    await mkdir(dirname(MODELS_STORAGE_FILE), { recursive: true });

    try {
      await access(MODELS_STORAGE_FILE);
      await this.readStateFromDisk();
    } catch (error) {
      if (!this.isMissingFileError(error)) {
        throw error;
      }

      await this.persistState({
        models: [],
        devices: [],
      });
    }
  }

  private async readStateFromDisk(): Promise<ModelsStorageState> {
    const rawContent = await readFile(MODELS_STORAGE_FILE, 'utf8');

    try {
      const parsedContent = JSON.parse(rawContent) as unknown;

      if (
        !this.isStorageState(parsedContent) ||
        !Array.isArray(parsedContent.models) ||
        !Array.isArray(parsedContent.devices)
      ) {
        throw new InternalServerErrorException(
          'Models storage format is invalid',
        );
      }

      return parsedContent;
    } catch {
      throw new InternalServerErrorException(
        'Models storage format is invalid',
      );
    }
  }

  private async persistState(state: ModelsStorageState): Promise<void> {
    await mkdir(dirname(MODELS_STORAGE_FILE), { recursive: true });
    await writeFile(
      MODELS_STORAGE_FILE,
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

  private isStorageState(value: unknown): value is ModelsStorageState {
    return typeof value === 'object' && value !== null;
  }
}
