import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type {
  CostByTimeQueryDto,
  CostByTimeResponseDto,
  CostStatsResponseDto,
  CostTimeGranularity,
  Tables,
} from '@repo/shared';
import type { Database } from '@repo/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../database';

type RepairRow = Tables<'sua_chua_bao_tri'>;
type DeviceRow = Pick<
  Tables<'thiet_bi'>,
  'id' | 'loai_thiet_bi_id' | 'phong_ban_id'
>;
type DeviceTypeRow = Pick<Tables<'loai_thiet_bi'>, 'id' | 'ten_loai'>;
type DepartmentRow = Pick<Tables<'phong_ban'>, 'id' | 'ten_phong_ban'>;

@Injectable()
export class ThongKeChiPhiService {
  private readonly client: SupabaseClient<Database>;

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getClient();
  }

  async byDeviceType(): Promise<CostStatsResponseDto> {
    const { repairs, devices } = await this.loadRepairAndDeviceData();
    const deviceTypeIds = Array.from(
      new Set(devices.map((item) => item.loai_thiet_bi_id)),
    );
    const deviceTypes = await this.loadDeviceTypes(deviceTypeIds);

    const aggregated = new Map<string, { label: string; totalCost: number }>();

    for (const repair of repairs) {
      const device = devices.find((item) => item.id === repair.thiet_bi_id);

      if (!device) {
        continue;
      }

      const deviceType = deviceTypes.get(device.loai_thiet_bi_id);
      const key = String(device.loai_thiet_bi_id);
      const currentValue = aggregated.get(key) ?? {
        label: deviceType?.ten_loai ?? 'Khong xac dinh',
        totalCost: 0,
      };

      currentValue.totalCost += repair.chi_phi ?? 0;
      aggregated.set(key, currentValue);
    }

    return {
      items: Array.from(aggregated.entries()).map(([key, value]) => ({
        key,
        label: value.label,
        totalCost: value.totalCost,
      })),
    };
  }

  async byDepartment(): Promise<CostStatsResponseDto> {
    const { repairs, devices } = await this.loadRepairAndDeviceData();
    const departmentIds = Array.from(
      new Set(
        devices
          .map((item) => item.phong_ban_id)
          .filter(
            (departmentId): departmentId is number => departmentId != null,
          ),
      ),
    );
    const departments = await this.loadDepartments(departmentIds);

    const aggregated = new Map<string, { label: string; totalCost: number }>();

    for (const repair of repairs) {
      const device = devices.find((item) => item.id === repair.thiet_bi_id);

      if (!device || device.phong_ban_id == null) {
        continue;
      }

      const department = departments.get(device.phong_ban_id);
      const key = String(device.phong_ban_id);
      const currentValue = aggregated.get(key) ?? {
        label: department?.ten_phong_ban ?? 'Khong xac dinh',
        totalCost: 0,
      };

      currentValue.totalCost += repair.chi_phi ?? 0;
      aggregated.set(key, currentValue);
    }

    return {
      items: Array.from(aggregated.entries()).map(([key, value]) => ({
        key,
        label: value.label,
        totalCost: value.totalCost,
      })),
    };
  }

  async byTime(query: CostByTimeQueryDto): Promise<CostByTimeResponseDto> {
    const repairs = await this.loadRepairs();
    const aggregated = new Map<string, number>();

    for (const repair of repairs) {
      const period = this.toPeriod(repair.ngay_ghi_nhan, query.granularity);
      aggregated.set(
        period,
        (aggregated.get(period) ?? 0) + (repair.chi_phi ?? 0),
      );
    }

    return {
      granularity: query.granularity,
      items: Array.from(aggregated.entries()).map(([period, totalCost]) => ({
        period,
        totalCost,
      })),
    };
  }

  private async loadRepairAndDeviceData(): Promise<{
    repairs: RepairRow[];
    devices: DeviceRow[];
  }> {
    const repairs = await this.loadRepairs();
    const deviceIds = Array.from(
      new Set(repairs.map((item) => item.thiet_bi_id)),
    );
    const devices = await this.loadDevices(deviceIds);

    return {
      repairs,
      devices,
    };
  }

  private async loadRepairs(): Promise<RepairRow[]> {
    const { data, error } = await this.client
      .from('sua_chua_bao_tri')
      .select('*');

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay du lieu sua chua/bao tri',
      );
    }

    return data ?? [];
  }

  private async loadDevices(deviceIds: number[]): Promise<DeviceRow[]> {
    if (deviceIds.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from('thiet_bi')
      .select('id, loai_thiet_bi_id, phong_ban_id')
      .in('id', deviceIds);

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay thong tin thiet bi',
      );
    }

    return data ?? [];
  }

  private async loadDeviceTypes(
    ids: number[],
  ): Promise<Map<number, DeviceTypeRow>> {
    if (ids.length === 0) {
      return new Map();
    }

    const { data, error } = await this.client
      .from('loai_thiet_bi')
      .select('id, ten_loai')
      .in('id', ids);

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay thong tin loai thiet bi',
      );
    }

    return new Map((data ?? []).map((item) => [item.id, item]));
  }

  private async loadDepartments(
    ids: number[],
  ): Promise<Map<number, DepartmentRow>> {
    if (ids.length === 0) {
      return new Map();
    }

    const { data, error } = await this.client
      .from('phong_ban')
      .select('id, ten_phong_ban')
      .in('id', ids);

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay thong tin phong ban',
      );
    }

    return new Map((data ?? []).map((item) => [item.id, item]));
  }

  private toPeriod(
    dateValue: string,
    granularity: CostTimeGranularity,
  ): string {
    const date = new Date(dateValue);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;

    if (granularity === 'month') {
      return `${year}-${String(month).padStart(2, '0')}`;
    }

    if (granularity === 'quarter') {
      return `${year}-Q${Math.floor((month - 1) / 3) + 1}`;
    }

    return String(year);
  }
}
