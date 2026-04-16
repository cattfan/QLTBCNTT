import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type {
  BanGiaoDto,
  BanGiaoResponseDto,
  CreateBanGiaoDto,
  Tables,
  TablesInsert,
} from '@repo/shared';
import type { Database } from '@repo/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../database';

type LichSuBanGiaoRow = Tables<'lich_su_ban_giao'>;
type LichSuBanGiaoInsert = TablesInsert<'lich_su_ban_giao'>;
type NguoiDungRow = Tables<'nguoi_dung'>;
type ThietBiRow = Tables<'thiet_bi'>;

interface CountResult {
  count: number | null;
  error: { message: string } | null;
}

@Injectable()
export class BanGiaoService {
  private readonly client: SupabaseClient<Database>;

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getClient();
  }

  async create(payload: CreateBanGiaoDto): Promise<BanGiaoResponseDto> {
    const thietBi = await this.findDevice(payload.thietBiId);
    await this.ensureDeviceNotLost(thietBi);
    await this.ensureDeviceNotBorrowed(payload.thietBiId);

    const nguoiNhan = await this.findRecipient(payload.nguoiNhanId);
    const usingStatusId = await this.ensureUsingStatusId();

    const insertPayload: LichSuBanGiaoInsert = {
      thiet_bi_id: payload.thietBiId,
      nguoi_nhan_id: payload.nguoiNhanId,
      phong_ban_nhan_id: nguoiNhan.phong_ban_id,
      ngay_ban_giao: this.getToday(),
      hinh_thuc: this.normalizeOptionalText(payload.hinhThuc),
      noi_dung: this.normalizeOptionalText(payload.noiDung),
      ghi_chu: this.normalizeOptionalText(payload.ghiChu),
    };

    const { data, error } = await this.client
      .from('lich_su_ban_giao')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Khong the tao ban ghi ban giao');
    }

    const { error: updateError } = await this.client
      .from('thiet_bi')
      .update({
        tinh_trang_id: usingStatusId,
        nguoi_su_dung_id: payload.nguoiNhanId,
      })
      .eq('id', payload.thietBiId);

    if (updateError) {
      throw new InternalServerErrorException(
        'Khong the cap nhat tinh trang thiet bi',
      );
    }

    return {
      message: 'Ban giao thiet bi thanh cong',
      handover: this.toDto(data),
    };
  }

  private async findDevice(id: number): Promise<ThietBiRow> {
    const { data, error } = await this.client
      .from('thiet_bi')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay thong tin thiet bi',
      );
    }

    if (!data) {
      throw new NotFoundException('Khong tim thay thiet bi');
    }

    return data;
  }

  private async findRecipient(id: number): Promise<NguoiDungRow> {
    const { data, error } = await this.client
      .from('nguoi_dung')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay thong tin nguoi nhan',
      );
    }

    if (!data) {
      throw new NotFoundException('Khong tim thay nguoi nhan');
    }

    return data;
  }

  private async ensureDeviceNotBorrowed(thietBiId: number): Promise<void> {
    const result = (await this.client
      .from('lich_su_ban_giao')
      .select('id', { count: 'exact', head: true })
      .eq('thiet_bi_id', thietBiId)
      .is('ngay_thu_hoi', null)) as CountResult;

    if (result.error) {
      throw new InternalServerErrorException(
        'Khong the kiem tra lich su ban giao',
      );
    }

    if ((result.count ?? 0) > 0) {
      throw new ConflictException(
        'Khong the ban giao thiet bi dang duoc nguoi khac muon',
      );
    }
  }

  private async ensureDeviceNotLost(thietBi: ThietBiRow): Promise<void> {
    if (!thietBi.tinh_trang_id) {
      return;
    }

    const { data, error } = await this.client
      .from('tinh_trang_thiet_bi')
      .select('*')
      .eq('id', thietBi.tinh_trang_id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Khong the kiem tra tinh trang thiet bi',
      );
    }

    if (!data) {
      return;
    }

    const normalizedCode = this.normalizeSearchValue(data.ma_tinh_trang ?? '');
    const normalizedName = this.normalizeSearchValue(data.ten_tinh_trang);

    if (
      normalizedCode === 'that_lac' ||
      normalizedName === 'that lac' ||
      normalizedName === 'thatlac'
    ) {
      throw new ConflictException(
        'Khong the ban giao thiet bi dang o tinh trang That lac',
      );
    }
  }

  private async ensureUsingStatusId(): Promise<number> {
    const { data, error } = await this.client
      .from('tinh_trang_thiet_bi')
      .select('*');

    if (error) {
      throw new InternalServerErrorException(
        'Khong the kiem tra tinh trang thiet bi',
      );
    }

    const matchedStatus = (data ?? []).find((status) => {
      const normalizedCode = this.normalizeSearchValue(
        status.ma_tinh_trang ?? '',
      );
      const normalizedName = this.normalizeSearchValue(status.ten_tinh_trang);

      return (
        normalizedCode === 'dang_su_dung' ||
        normalizedName === 'dang su dung' ||
        normalizedName === 'dangsudung'
      );
    });

    if (matchedStatus) {
      return matchedStatus.id;
    }

    const { data: insertedStatus, error: insertError } = await this.client
      .from('tinh_trang_thiet_bi')
      .insert({
        ma_tinh_trang: 'DANG_SU_DUNG',
        ten_tinh_trang: 'Đang sử dụng',
      })
      .select('*')
      .single();

    if (insertError || !insertedStatus) {
      throw new InternalServerErrorException(
        'Khong the tao tinh trang Dang su dung mac dinh',
      );
    }

    return insertedStatus.id;
  }

  private toDto(row: LichSuBanGiaoRow): BanGiaoDto {
    return {
      id: row.id,
      thietBiId: row.thiet_bi_id,
      nguoiNhanId: row.nguoi_nhan_id,
      phongBanNhanId: row.phong_ban_nhan_id,
      ngayBanGiao: row.ngay_ban_giao,
      ngayThuHoi: row.ngay_thu_hoi,
      hinhThuc: row.hinh_thuc,
      noiDung: row.noi_dung,
      ghiChu: row.ghi_chu,
    };
  }

  private getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (value == null) {
      return null;
    }

    const normalizedValue = value.trim();
    return normalizedValue ? normalizedValue : null;
  }

  private normalizeSearchValue(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toLowerCase();
  }
}
