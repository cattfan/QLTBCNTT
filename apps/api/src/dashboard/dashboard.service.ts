import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type {
  DashboardDepartmentDistributionDto,
  DashboardOverviewDto,
  DashboardRecentEventDto,
  DashboardRecentEventsDto,
  Tables,
} from '@repo/shared';
import type { Database } from '@repo/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../database';

type DeviceRow = Pick<
  Tables<'thiet_bi'>,
  'id' | 'ma_thiet_bi' | 'ten_thiet_bi' | 'phong_ban_id' | 'tinh_trang_id'
>;
type StatusRow = Pick<
  Tables<'tinh_trang_thiet_bi'>,
  'id' | 'ma_tinh_trang' | 'ten_tinh_trang'
>;
type DepartmentRow = Pick<Tables<'phong_ban'>, 'id' | 'ten_phong_ban'>;
type HandoverRow = Tables<'lich_su_ban_giao'>;
type RepairRow = Pick<
  Tables<'sua_chua_bao_tri'>,
  'id' | 'thiet_bi_id' | 'ngay_ghi_nhan' | 'mo_ta_loi'
>;
type UserRow = Pick<Tables<'nguoi_dung'>, 'id' | 'ten_dang_nhap' | 'ho_ten'>;

@Injectable()
export class DashboardService {
  private readonly client: SupabaseClient<Database>;

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getClient();
  }

  async getOverview(): Promise<DashboardOverviewDto> {
    const [devices, statuses, repairs] = await Promise.all([
      this.loadDevices(),
      this.loadStatuses(),
      this.loadOpenRepairs(),
    ]);

    const inUseStatusId = this.findStatusId(statuses, 'DANG_SU_DUNG');
    const inStockStatusId = this.findStatusId(statuses, 'LUU_KHO');

    return {
      totalDevices: devices.length,
      inUseDevices: devices.filter(
        (item) => item.tinh_trang_id === inUseStatusId,
      ).length,
      inStockDevices: devices.filter(
        (item) => item.tinh_trang_id === inStockStatusId,
      ).length,
      inRepairDevices: new Set(repairs.map((item) => item.thiet_bi_id)).size,
    };
  }

  async getDepartmentDistribution(): Promise<DashboardDepartmentDistributionDto> {
    const [devices, departments] = await Promise.all([
      this.loadDevices(),
      this.loadDepartments(),
    ]);

    const departmentMap = new Map(departments.map((item) => [item.id, item]));
    const aggregated = new Map<number, number>();

    for (const device of devices) {
      if (device.phong_ban_id == null) {
        continue;
      }

      aggregated.set(
        device.phong_ban_id,
        (aggregated.get(device.phong_ban_id) ?? 0) + 1,
      );
    }

    return {
      items: Array.from(aggregated.entries()).map(
        ([departmentId, totalDevices]) => ({
          departmentId,
          departmentName:
            departmentMap.get(departmentId)?.ten_phong_ban ?? 'Khong xac dinh',
          totalDevices,
        }),
      ),
    };
  }

  async getRecentEvents(): Promise<DashboardRecentEventsDto> {
    const [devices, users, handovers, repairs] = await Promise.all([
      this.loadDevices(),
      this.loadUsers(),
      this.loadHandovers(),
      this.loadRepairs(),
    ]);

    const deviceMap = new Map(devices.map((item) => [item.id, item]));
    const userMap = new Map(users.map((item) => [item.id, item]));
    const events: DashboardRecentEventDto[] = [];

    for (const handover of handovers) {
      const device = deviceMap.get(handover.thiet_bi_id);
      const user = handover.nguoi_nhan_id
        ? userMap.get(handover.nguoi_nhan_id)
        : undefined;

      if (device) {
        events.push({
          eventType: 'ban_giao',
          occurredAt: handover.ngay_ban_giao,
          deviceId: device.id,
          deviceCode: device.ma_thiet_bi,
          deviceName: device.ten_thiet_bi,
          employeeId: handover.nguoi_nhan_id,
          employeeCode: user?.ten_dang_nhap ?? null,
          employeeName: user?.ho_ten ?? null,
          note: handover.noi_dung ?? handover.ghi_chu,
        });
      }

      if (handover.ngay_thu_hoi && device) {
        events.push({
          eventType: 'thu_hoi',
          occurredAt: handover.ngay_thu_hoi,
          deviceId: device.id,
          deviceCode: device.ma_thiet_bi,
          deviceName: device.ten_thiet_bi,
          employeeId: handover.nguoi_nhan_id,
          employeeCode: user?.ten_dang_nhap ?? null,
          employeeName: user?.ho_ten ?? null,
          note: handover.ghi_chu,
        });
      }
    }

    for (const repair of repairs) {
      const device = deviceMap.get(repair.thiet_bi_id);

      if (!device) {
        continue;
      }

      events.push({
        eventType: 'bao_hong',
        occurredAt: repair.ngay_ghi_nhan,
        deviceId: device.id,
        deviceCode: device.ma_thiet_bi,
        deviceName: device.ten_thiet_bi,
        employeeId: null,
        employeeCode: null,
        employeeName: null,
        note: repair.mo_ta_loi,
      });
    }

    events.sort((left, right) =>
      right.occurredAt.localeCompare(left.occurredAt),
    );

    return {
      items: events.slice(0, 10),
    };
  }

  private async loadDevices(): Promise<DeviceRow[]> {
    const { data, error } = await this.client
      .from('thiet_bi')
      .select('id, ma_thiet_bi, ten_thiet_bi, phong_ban_id, tinh_trang_id');

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay thong tin thiet bi',
      );
    }

    return data ?? [];
  }

  private async loadStatuses(): Promise<StatusRow[]> {
    const { data, error } = await this.client
      .from('tinh_trang_thiet_bi')
      .select('id, ma_tinh_trang, ten_tinh_trang');

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay danh sach tinh trang thiet bi',
      );
    }

    return data ?? [];
  }

  private async loadDepartments(): Promise<DepartmentRow[]> {
    const { data, error } = await this.client
      .from('phong_ban')
      .select('id, ten_phong_ban');

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay danh sach phong ban',
      );
    }

    return data ?? [];
  }

  private async loadUsers(): Promise<UserRow[]> {
    const { data, error } = await this.client
      .from('nguoi_dung')
      .select('id, ten_dang_nhap, ho_ten');

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay danh sach nguoi dung',
      );
    }

    return data ?? [];
  }

  private async loadHandovers(): Promise<HandoverRow[]> {
    const { data, error } = await this.client
      .from('lich_su_ban_giao')
      .select('*');

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay danh sach lich su ban giao',
      );
    }

    return data ?? [];
  }

  private async loadRepairs(): Promise<RepairRow[]> {
    const { data, error } = await this.client
      .from('sua_chua_bao_tri')
      .select('id, thiet_bi_id, ngay_ghi_nhan, mo_ta_loi');

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay danh sach sua chua bao tri',
      );
    }

    return data ?? [];
  }

  private async loadOpenRepairs(): Promise<RepairRow[]> {
    const { data, error } = await this.client
      .from('sua_chua_bao_tri')
      .select('id, thiet_bi_id, ngay_ghi_nhan, mo_ta_loi')
      .is('ngay_sua_chua', null);

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay danh sach sua chua dang xu ly',
      );
    }

    return data ?? [];
  }

  private findStatusId(statuses: StatusRow[], code: string): number | null {
    const matchedStatus = statuses.find((status) => {
      const normalizedCode = this.normalize(status.ma_tinh_trang ?? '');
      const normalizedName = this.normalize(status.ten_tinh_trang);

      if (code === 'DANG_SU_DUNG') {
        return (
          normalizedCode === 'dang_su_dung' ||
          normalizedName === 'dang su dung' ||
          normalizedName === 'dangsudung'
        );
      }

      return (
        normalizedCode === 'luu_kho' ||
        normalizedName === 'luu kho' ||
        normalizedName === 'luukho'
      );
    });

    return matchedStatus?.id ?? null;
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toLowerCase();
  }
}
