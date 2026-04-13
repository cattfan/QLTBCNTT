import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseCrudService } from '../common/base-crud.service';
import type { CreateOperatingSystemDto } from './dto/create-operating-system.dto';
import type { ListOperatingSystemsQueryDto } from './dto/list-operating-systems-query.dto';
import type { UpdateOperatingSystemDto } from './dto/update-operating-system.dto';
import { OperatingSystemsStore } from './operating-systems.store';
import type {
  OperatingSystemListItem,
  OperatingSystemRecord,
} from './operating-systems.types';

@Injectable()
export class OperatingSystemsService extends BaseCrudService {
  constructor(private readonly operatingSystemsStore: OperatingSystemsStore) {
    super();
  }

  async listOperatingSystems(query: ListOperatingSystemsQueryDto) {
    const operatingSystems =
      await this.operatingSystemsStore.listOperatingSystems();
    const devices = await this.operatingSystemsStore.listDevices();

    const items: OperatingSystemListItem[] = operatingSystems.map(
      (operatingSystem) => ({
        ...operatingSystem,
        deviceCount: devices.filter(
          (device) => device.operatingSystemId === operatingSystem.id,
        ).length,
      }),
    );

    return this.buildPaginatedSearchResult(items, query, {
      matchesSearch: (operatingSystem, normalizedSearch) =>
        operatingSystem.name.toLowerCase().includes(normalizedSearch),
      sort: (left, right) => left.code.localeCompare(right.code),
    });
  }

  async getOperatingSystemById(operatingSystemId: string) {
    const operatingSystem =
      await this.operatingSystemsStore.findOperatingSystemById(
        operatingSystemId,
      );

    if (!operatingSystem) {
      throw new NotFoundException('Operating system not found');
    }

    const deviceCount =
      await this.operatingSystemsStore.countLinkedDevices(operatingSystemId);

    return {
      operatingSystem: {
        ...operatingSystem,
        deviceCount,
      },
    };
  }

  async createOperatingSystem(payload: CreateOperatingSystemDto) {
    const preparedPayload = await this.prepareOperatingSystemPayload(payload);
    const operatingSystem =
      await this.operatingSystemsStore.createOperatingSystem(preparedPayload);

    return {
      message: 'Operating system created successfully',
      operatingSystem,
    };
  }

  async updateOperatingSystem(
    operatingSystemId: string,
    payload: UpdateOperatingSystemDto,
  ) {
    const existingOperatingSystem =
      await this.operatingSystemsStore.findOperatingSystemById(
        operatingSystemId,
      );

    if (!existingOperatingSystem) {
      throw new NotFoundException('Operating system not found');
    }

    const preparedPayload = await this.prepareOperatingSystemPayload(payload, {
      allowPartial: true,
      currentOperatingSystem: existingOperatingSystem,
    });

    const operatingSystem =
      await this.operatingSystemsStore.updateOperatingSystem(
        operatingSystemId,
        preparedPayload,
      );

    return {
      message: 'Operating system updated successfully',
      operatingSystem,
    };
  }

  async deleteOperatingSystem(operatingSystemId: string) {
    const operatingSystem =
      await this.operatingSystemsStore.findOperatingSystemById(
        operatingSystemId,
      );

    if (!operatingSystem) {
      throw new NotFoundException('Operating system not found');
    }

    const deviceCount =
      await this.operatingSystemsStore.countLinkedDevices(operatingSystemId);

    if (deviceCount > 0) {
      throw new ConflictException(
        'Cannot delete operating system while devices are linked',
      );
    }

    await this.operatingSystemsStore.deleteOperatingSystem(operatingSystemId);

    return {
      message: 'Operating system deleted successfully',
    };
  }

  private async prepareOperatingSystemPayload(
    payload: CreateOperatingSystemDto | UpdateOperatingSystemDto,
    options?: {
      allowPartial?: boolean;
      currentOperatingSystem?: OperatingSystemRecord;
    },
  ): Promise<{
    code: string;
    name: string;
    description: string;
  }> {
    const currentOperatingSystem = options?.currentOperatingSystem;
    const allowPartial = options?.allowPartial ?? false;

    const code = this.resolveRequiredText(
      payload.code,
      currentOperatingSystem?.code,
      allowPartial,
      'code',
    );
    const name = this.resolveRequiredText(
      payload.name,
      currentOperatingSystem?.name,
      allowPartial,
      'name',
    );
    const description = this.resolveOptionalText(
      payload.description,
      currentOperatingSystem?.description,
    );

    const operatingSystemWithSameCode =
      await this.operatingSystemsStore.findOperatingSystemByCode(code);

    if (
      operatingSystemWithSameCode &&
      operatingSystemWithSameCode.id !== currentOperatingSystem?.id
    ) {
      throw new ConflictException('Operating system code already exists');
    }

    return {
      code: code.toUpperCase(),
      name,
      description,
    };
  }
}
