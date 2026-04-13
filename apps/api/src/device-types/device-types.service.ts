import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateDeviceTypeDto } from './dto/create-device-type.dto';
import type { ListDeviceTypesQueryDto } from './dto/list-device-types-query.dto';
import type { UpdateDeviceTypeDto } from './dto/update-device-type.dto';
import { DeviceTypesStore } from './device-types.store';
import type {
  DeviceTypeListItem,
  DeviceTypeListResponse,
  DeviceTypeRecord,
} from './device-types.types';

@Injectable()
export class DeviceTypesService {
  constructor(private readonly deviceTypesStore: DeviceTypesStore) {}

  async listDeviceTypes(
    query: ListDeviceTypesQueryDto,
  ): Promise<DeviceTypeListResponse> {
    const page = this.parsePositiveInteger(query.page, 1, 'page');
    const pageSize = this.parsePositiveInteger(query.pageSize, 10, 'pageSize');
    const search = query.search?.trim() ?? '';
    const normalizedSearch = search.toLowerCase();
    const deviceTypes = await this.deviceTypesStore.listDeviceTypes();
    const devices = await this.deviceTypesStore.listDevices();

    const filteredDeviceTypes = deviceTypes
      .filter((deviceType) => {
        if (!normalizedSearch) {
          return true;
        }

        return deviceType.name.toLowerCase().includes(normalizedSearch);
      })
      .sort((left, right) => left.code.localeCompare(right.code));

    const items: DeviceTypeListItem[] = filteredDeviceTypes.map(
      (deviceType) => ({
        ...deviceType,
        deviceCount: devices.filter((device) => device.typeId === deviceType.id)
          .length,
      }),
    );

    const totalItems = items.length;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;

    return {
      items: items.slice(offset, offset + pageSize),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
      filters: {
        search,
      },
    };
  }

  async getDeviceTypeById(deviceTypeId: string) {
    const deviceType =
      await this.deviceTypesStore.findDeviceTypeById(deviceTypeId);

    if (!deviceType) {
      throw new NotFoundException('Device type not found');
    }

    const deviceCount =
      await this.deviceTypesStore.countLinkedDevices(deviceTypeId);

    return {
      deviceType: {
        ...deviceType,
        deviceCount,
      },
    };
  }

  async createDeviceType(payload: CreateDeviceTypeDto) {
    const preparedPayload = await this.prepareDeviceTypePayload(payload);
    const deviceType =
      await this.deviceTypesStore.createDeviceType(preparedPayload);

    return {
      message: 'Device type created successfully',
      deviceType,
    };
  }

  async updateDeviceType(deviceTypeId: string, payload: UpdateDeviceTypeDto) {
    const existingDeviceType =
      await this.deviceTypesStore.findDeviceTypeById(deviceTypeId);

    if (!existingDeviceType) {
      throw new NotFoundException('Device type not found');
    }

    const preparedPayload = await this.prepareDeviceTypePayload(payload, {
      allowPartial: true,
      currentDeviceType: existingDeviceType,
    });

    const deviceType = await this.deviceTypesStore.updateDeviceType(
      deviceTypeId,
      preparedPayload,
    );

    return {
      message: 'Device type updated successfully',
      deviceType,
    };
  }

  async deleteDeviceType(deviceTypeId: string) {
    const deviceType =
      await this.deviceTypesStore.findDeviceTypeById(deviceTypeId);

    if (!deviceType) {
      throw new NotFoundException('Device type not found');
    }

    const deviceCount =
      await this.deviceTypesStore.countLinkedDevices(deviceTypeId);

    if (deviceCount > 0) {
      throw new ConflictException(
        'Cannot delete device type while devices are linked',
      );
    }

    await this.deviceTypesStore.deleteDeviceType(deviceTypeId);

    return {
      message: 'Device type deleted successfully',
    };
  }

  private async prepareDeviceTypePayload(
    payload: CreateDeviceTypeDto | UpdateDeviceTypeDto,
    options?: {
      allowPartial?: boolean;
      currentDeviceType?: DeviceTypeRecord;
    },
  ): Promise<{
    code: string;
    name: string;
    description: string;
  }> {
    const currentDeviceType = options?.currentDeviceType;
    const allowPartial = options?.allowPartial ?? false;

    const code = this.resolveRequiredText(
      payload.code,
      currentDeviceType?.code,
      allowPartial,
      'code',
    );
    const name = this.resolveRequiredText(
      payload.name,
      currentDeviceType?.name,
      allowPartial,
      'name',
    );
    const description = this.resolveOptionalText(
      payload.description,
      currentDeviceType?.description,
    );

    const deviceTypeWithSameCode =
      await this.deviceTypesStore.findDeviceTypeByCode(code);

    if (
      deviceTypeWithSameCode &&
      deviceTypeWithSameCode.id !== currentDeviceType?.id
    ) {
      throw new ConflictException('Device type code already exists');
    }

    return {
      code: code.toUpperCase(),
      name,
      description,
    };
  }

  private resolveRequiredText(
    value: unknown,
    fallbackValue: string | undefined,
    allowPartial: boolean,
    fieldName: string,
  ): string {
    if (value === undefined && allowPartial && fallbackValue) {
      return fallbackValue;
    }

    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    return value.trim();
  }

  private resolveOptionalText(
    value: unknown,
    fallbackValue: string | undefined,
  ): string {
    if (value === undefined) {
      return fallbackValue ?? '';
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('description must be a string');
    }

    return value.trim();
  }

  private parsePositiveInteger(
    value: string | undefined,
    fallbackValue: number,
    fieldName: string,
  ): number {
    if (value === undefined || value.trim() === '') {
      return fallbackValue;
    }

    const parsedValue = Number.parseInt(value, 10);

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
      throw new BadRequestException(`${fieldName} must be a positive integer`);
    }

    return parsedValue;
  }
}
