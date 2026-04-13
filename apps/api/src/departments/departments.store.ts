import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DEPARTMENTS_STORAGE_FILE } from './departments.constants';
import {
  DepartmentRecord,
  DepartmentsStorageState,
  DeviceLinkRecord,
  EmployeeLinkRecord,
} from './departments.types';

@Injectable()
export class DepartmentsStore implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.ensureStorageReady();
  }

  async getState(): Promise<DepartmentsStorageState> {
    await this.ensureStorageReady();
    return this.readStateFromDisk();
  }

  async listDepartments(): Promise<DepartmentRecord[]> {
    const state = await this.getState();
    return state.departments;
  }

  async findDepartmentById(id: string): Promise<DepartmentRecord | null> {
    const state = await this.getState();
    return state.departments.find((department) => department.id === id) ?? null;
  }

  async findDepartmentByCode(code: string): Promise<DepartmentRecord | null> {
    const normalizedCode = this.normalizeCode(code);
    const state = await this.getState();

    return (
      state.departments.find(
        (department) => this.normalizeCode(department.code) === normalizedCode,
      ) ?? null
    );
  }

  async createDepartment(
    payload: Omit<DepartmentRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<DepartmentRecord> {
    const state = await this.getState();
    const now = new Date().toISOString();
    const department: DepartmentRecord = {
      id: randomUUID(),
      code: payload.code,
      name: payload.name,
      description: payload.description,
      createdAt: now,
      updatedAt: now,
    };

    state.departments.push(department);
    await this.persistState(state);

    return department;
  }

  async updateDepartment(
    departmentId: string,
    payload: Partial<Pick<DepartmentRecord, 'code' | 'name' | 'description'>>,
  ): Promise<DepartmentRecord> {
    const state = await this.getState();
    const departmentIndex = state.departments.findIndex(
      (department) => department.id === departmentId,
    );

    if (departmentIndex === -1) {
      throw new InternalServerErrorException('Department not found');
    }

    const updatedDepartment: DepartmentRecord = {
      ...state.departments[departmentIndex],
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    state.departments[departmentIndex] = updatedDepartment;
    await this.persistState(state);

    return updatedDepartment;
  }

  async deleteDepartment(departmentId: string): Promise<void> {
    const state = await this.getState();
    state.departments = state.departments.filter(
      (department) => department.id !== departmentId,
    );
    await this.persistState(state);
  }

  async countLinkedResources(departmentId: string): Promise<{
    employeeCount: number;
    deviceCount: number;
  }> {
    const state = await this.getState();

    return {
      employeeCount: state.employees.filter(
        (employee) => employee.departmentId === departmentId,
      ).length,
      deviceCount: state.devices.filter(
        (device) => device.departmentId === departmentId,
      ).length,
    };
  }

  async listEmployees(): Promise<EmployeeLinkRecord[]> {
    const state = await this.getState();
    return state.employees;
  }

  async listDevices(): Promise<DeviceLinkRecord[]> {
    const state = await this.getState();
    return state.devices;
  }

  private async ensureStorageReady(): Promise<void> {
    await mkdir(dirname(DEPARTMENTS_STORAGE_FILE), { recursive: true });

    try {
      await access(DEPARTMENTS_STORAGE_FILE);
      await this.readStateFromDisk();
    } catch (error) {
      if (!this.isMissingFileError(error)) {
        throw error;
      }

      await this.persistState({
        departments: [],
        employees: [],
        devices: [],
      });
    }
  }

  private async readStateFromDisk(): Promise<DepartmentsStorageState> {
    const rawContent = await readFile(DEPARTMENTS_STORAGE_FILE, 'utf8');

    try {
      const parsedContent = JSON.parse(rawContent) as unknown;

      if (
        !this.isStorageState(parsedContent) ||
        !Array.isArray(parsedContent.departments) ||
        !Array.isArray(parsedContent.employees) ||
        !Array.isArray(parsedContent.devices)
      ) {
        throw new InternalServerErrorException(
          'Departments storage format is invalid',
        );
      }

      return parsedContent;
    } catch {
      throw new InternalServerErrorException(
        'Departments storage format is invalid',
      );
    }
  }

  private async persistState(state: DepartmentsStorageState): Promise<void> {
    await mkdir(dirname(DEPARTMENTS_STORAGE_FILE), { recursive: true });
    await writeFile(
      DEPARTMENTS_STORAGE_FILE,
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

  private isStorageState(value: unknown): value is DepartmentsStorageState {
    return typeof value === 'object' && value !== null;
  }
}
