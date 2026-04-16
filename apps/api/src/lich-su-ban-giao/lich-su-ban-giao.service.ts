import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type {
  LichSuBanGiaoDto,
  LichSuBanGiaoListResponseDto,
  LichSuBanGiaoQueryDto,
  Tables,
} from '@repo/shared';
import type { Database } from '@repo/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../database';

type LichSuBanGiaoRow = Tables<'lich_su_ban_giao'>;
type NguoiDungRow = Tables<'nguoi_dung'>;
type ThietBiRow = Tables<'thiet_bi'>;

@Injectable()
export class LichSuBanGiaoService {
  private readonly client: SupabaseClient<Database>;

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getClient();
  }

  async findAll(
    query: LichSuBanGiaoQueryDto,
  ): Promise<LichSuBanGiaoListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const { data: histories, error } = await this.client
      .from('lich_su_ban_giao')
      .select('*')
      .order('ngay_ban_giao', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay danh sach lich su ban giao',
      );
    }

    const historyRows = histories ?? [];
    const userIds = Array.from(
      new Set(historyRows.map((item) => item.nguoi_nhan_id).filter(Boolean)),
    ) as number[];
    const deviceIds = Array.from(
      new Set(historyRows.map((item) => item.thiet_bi_id)),
    );

    const [usersMap, devicesMap] = await Promise.all([
      this.loadUsersMap(userIds),
      this.loadDevicesMap(deviceIds),
    ]);

    const mappedItems = historyRows.map((item) =>
      this.toDto(item, usersMap, devicesMap),
    );

    let filteredItems = mappedItems;

    if (query.employeeCode) {
      const normalizedEmployeeCode = query.employeeCode.trim().toLowerCase();
      filteredItems = filteredItems.filter((item) =>
        item.employeeCode?.toLowerCase().includes(normalizedEmployeeCode),
      );
    }

    if (query.deviceCode) {
      const normalizedDeviceCode = query.deviceCode.trim().toLowerCase();
      filteredItems = filteredItems.filter((item) =>
        item.thietBiCode.toLowerCase().includes(normalizedDeviceCode),
      );
    }

    if (query.status) {
      filteredItems = filteredItems.filter(
        (item) => item.status === query.status,
      );
    }

    const offset = (page - 1) * limit;
    const items = filteredItems.slice(offset, offset + limit);
    const total = filteredItems.length;

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async loadUsersMap(
    userIds: number[],
  ): Promise<
    Map<number, Pick<NguoiDungRow, 'id' | 'ten_dang_nhap' | 'ho_ten'>>
  > {
    if (userIds.length === 0) {
      return new Map();
    }

    const { data, error } = await this.client
      .from('nguoi_dung')
      .select('id, ten_dang_nhap, ho_ten')
      .in('id', userIds);

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay thong tin nguoi nhan',
      );
    }

    return new Map((data ?? []).map((item) => [item.id, item]));
  }

  private async loadDevicesMap(
    deviceIds: number[],
  ): Promise<
    Map<number, Pick<ThietBiRow, 'id' | 'ma_thiet_bi' | 'ten_thiet_bi'>>
  > {
    if (deviceIds.length === 0) {
      return new Map();
    }

    const { data, error } = await this.client
      .from('thiet_bi')
      .select('id, ma_thiet_bi, ten_thiet_bi')
      .in('id', deviceIds);

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay thong tin thiet bi',
      );
    }

    return new Map((data ?? []).map((item) => [item.id, item]));
  }

  private toDto(
    row: LichSuBanGiaoRow,
    usersMap: Map<
      number,
      Pick<NguoiDungRow, 'id' | 'ten_dang_nhap' | 'ho_ten'>
    >,
    devicesMap: Map<
      number,
      Pick<ThietBiRow, 'id' | 'ma_thiet_bi' | 'ten_thiet_bi'>
    >,
  ): LichSuBanGiaoDto {
    const user = row.nguoi_nhan_id
      ? usersMap.get(row.nguoi_nhan_id)
      : undefined;
    const device = devicesMap.get(row.thiet_bi_id);

    return {
      id: row.id,
      thietBiId: row.thiet_bi_id,
      thietBiCode: device?.ma_thiet_bi ?? '',
      thietBiName: device?.ten_thiet_bi ?? '',
      nguoiNhanId: row.nguoi_nhan_id,
      employeeCode: user?.ten_dang_nhap ?? null,
      employeeName: user?.ho_ten ?? null,
      phongBanNhanId: row.phong_ban_nhan_id,
      handoverDate: row.ngay_ban_giao,
      returnDate: row.ngay_thu_hoi,
      status: row.ngay_thu_hoi ? 'da_tra' : 'dang_muon',
      handoverType: row.hinh_thuc,
      content: row.noi_dung,
      note: row.ghi_chu,
    };
  }
}
