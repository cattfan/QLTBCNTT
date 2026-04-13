import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateDepartmentDto } from './dto/create-department.dto';
import type { ListDepartmentsQueryDto } from './dto/list-departments-query.dto';
import type { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentsStore } from './departments.store';
import type {
  DepartmentListItem,
  DepartmentListResponse,
  DepartmentRecord,
} from './departments.types';

@Injectable()
export class DepartmentsService {
  constructor(private readonly departmentsStore: DepartmentsStore) {}

  async listDepartments(
    query: ListDepartmentsQueryDto,
  ): Promise<DepartmentListResponse> {
    const page = this.parsePositiveInteger(query.page, 1, 'page');
    const pageSize = this.parsePositiveInteger(query.pageSize, 10, 'pageSize');
    const search = query.search?.trim() ?? '';
    const normalizedSearch = search.toLowerCase();
    const departments = await this.departmentsStore.listDepartments();
    const employees = await this.departmentsStore.listEmployees();
    const devices = await this.departmentsStore.listDevices();

    const filteredDepartments = departments
      .filter((department) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          department.code.toLowerCase().includes(normalizedSearch) ||
          department.name.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((left, right) => left.code.localeCompare(right.code));

    const items: DepartmentListItem[] = filteredDepartments.map(
      (department) => ({
        ...department,
        employeeCount: employees.filter(
          (employee) => employee.departmentId === department.id,
        ).length,
        deviceCount: devices.filter(
          (device) => device.departmentId === department.id,
        ).length,
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

  async getDepartmentById(departmentId: string) {
    const department =
      await this.departmentsStore.findDepartmentById(departmentId);

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const linkedCounts =
      await this.departmentsStore.countLinkedResources(departmentId);

    return {
      department: {
        ...department,
        ...linkedCounts,
      },
    };
  }

  async createDepartment(payload: CreateDepartmentDto) {
    const preparedPayload = await this.prepareDepartmentPayload(payload);

    const department =
      await this.departmentsStore.createDepartment(preparedPayload);

    return {
      message: 'Department created successfully',
      department,
    };
  }

  async updateDepartment(departmentId: string, payload: UpdateDepartmentDto) {
    const existingDepartment =
      await this.departmentsStore.findDepartmentById(departmentId);

    if (!existingDepartment) {
      throw new NotFoundException('Department not found');
    }

    const preparedPayload = await this.prepareDepartmentPayload(payload, {
      allowPartial: true,
      currentDepartment: existingDepartment,
    });

    const department = await this.departmentsStore.updateDepartment(
      departmentId,
      preparedPayload,
    );

    return {
      message: 'Department updated successfully',
      department,
    };
  }

  async deleteDepartment(departmentId: string) {
    const department =
      await this.departmentsStore.findDepartmentById(departmentId);

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const linkedCounts =
      await this.departmentsStore.countLinkedResources(departmentId);

    if (linkedCounts.employeeCount > 0 || linkedCounts.deviceCount > 0) {
      throw new ConflictException(
        'Cannot delete department while employees or devices are linked',
      );
    }

    await this.departmentsStore.deleteDepartment(departmentId);

    return {
      message: 'Department deleted successfully',
    };
  }

  private async prepareDepartmentPayload(
    payload: CreateDepartmentDto | UpdateDepartmentDto,
    options?: {
      allowPartial?: boolean;
      currentDepartment?: DepartmentRecord;
    },
  ): Promise<{
    code: string;
    name: string;
    description: string;
  }> {
    const currentDepartment = options?.currentDepartment;
    const allowPartial = options?.allowPartial ?? false;

    const code = this.resolveRequiredText(
      payload.code,
      currentDepartment?.code,
      allowPartial,
      'code',
    );
    const name = this.resolveRequiredText(
      payload.name,
      currentDepartment?.name,
      allowPartial,
      'name',
    );
    const description = this.resolveOptionalText(
      payload.description,
      currentDepartment?.description,
    );

    const departmentWithSameCode =
      await this.departmentsStore.findDepartmentByCode(code);

    if (
      departmentWithSameCode &&
      departmentWithSameCode.id !== currentDepartment?.id
    ) {
      throw new ConflictException('Department code already exists');
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
