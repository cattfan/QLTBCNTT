import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseCrudService } from '../common/base-crud.service';
import type { CreateModelDto } from './dto/create-model.dto';
import type { ListModelsQueryDto } from './dto/list-models-query.dto';
import type { UpdateModelDto } from './dto/update-model.dto';
import { ModelsStore } from './models.store';
import type { ModelListItem, ModelRecord } from './models.types';

@Injectable()
export class ModelsService extends BaseCrudService {
  constructor(private readonly modelsStore: ModelsStore) {
    super();
  }

  async listModels(query: ListModelsQueryDto) {
    const models = await this.modelsStore.listModels();
    const devices = await this.modelsStore.listDevices();

    const items: ModelListItem[] = models.map((model) => ({
      ...model,
      deviceCount: devices.filter((device) => device.modelId === model.id)
        .length,
    }));

    return this.buildPaginatedSearchResult(items, query, {
      matchesSearch: (model, normalizedSearch) =>
        model.name.toLowerCase().includes(normalizedSearch),
      sort: (left, right) => left.code.localeCompare(right.code),
    });
  }

  async getModelById(modelId: string) {
    const model = await this.modelsStore.findModelById(modelId);

    if (!model) {
      throw new NotFoundException('Model not found');
    }

    const deviceCount = await this.modelsStore.countLinkedDevices(modelId);

    return {
      model: {
        ...model,
        deviceCount,
      },
    };
  }

  async createModel(payload: CreateModelDto) {
    const preparedPayload = await this.prepareModelPayload(payload);
    const model = await this.modelsStore.createModel(preparedPayload);

    return {
      message: 'Model created successfully',
      model,
    };
  }

  async updateModel(modelId: string, payload: UpdateModelDto) {
    const existingModel = await this.modelsStore.findModelById(modelId);

    if (!existingModel) {
      throw new NotFoundException('Model not found');
    }

    const preparedPayload = await this.prepareModelPayload(payload, {
      allowPartial: true,
      currentModel: existingModel,
    });

    const model = await this.modelsStore.updateModel(modelId, preparedPayload);

    return {
      message: 'Model updated successfully',
      model,
    };
  }

  async deleteModel(modelId: string) {
    const model = await this.modelsStore.findModelById(modelId);

    if (!model) {
      throw new NotFoundException('Model not found');
    }

    const deviceCount = await this.modelsStore.countLinkedDevices(modelId);

    if (deviceCount > 0) {
      throw new ConflictException(
        'Cannot delete model while devices are linked',
      );
    }

    await this.modelsStore.deleteModel(modelId);

    return {
      message: 'Model deleted successfully',
    };
  }

  private async prepareModelPayload(
    payload: CreateModelDto | UpdateModelDto,
    options?: {
      allowPartial?: boolean;
      currentModel?: ModelRecord;
    },
  ): Promise<{
    code: string;
    name: string;
    description: string;
  }> {
    const currentModel = options?.currentModel;
    const allowPartial = options?.allowPartial ?? false;

    const code = this.resolveRequiredText(
      payload.code,
      currentModel?.code,
      allowPartial,
      'code',
    );
    const name = this.resolveRequiredText(
      payload.name,
      currentModel?.name,
      allowPartial,
      'name',
    );
    const description = this.resolveOptionalText(
      payload.description,
      currentModel?.description,
    );

    const modelWithSameCode = await this.modelsStore.findModelByCode(code);

    if (modelWithSameCode && modelWithSameCode.id !== currentModel?.id) {
      throw new ConflictException('Model code already exists');
    }

    return {
      code: code.toUpperCase(),
      name,
      description,
    };
  }
}
