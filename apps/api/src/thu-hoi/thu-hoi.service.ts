import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateThuHoiDto,
  Tables,
  TablesInsert,
  ThuHoiDto,
  ThuHoiResponseDto,
} from '@repo/shared';
import type { Database } from '@repo/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../database';

type LichSuBanGiaoRow = Tables<'lich_su_ban_giao'>;
type ThietBiRow = Tables<'thiet_bi'>;

@Injectable()
export class ThuHoiService {
  private readonly client: SupabaseClient<Database>;

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getClient();
  }

  async create(payload: CreateThuHoiDto): Promise<ThuHoiResponseDto> {
    await this.findDevice(payload.thietBiId);
    const openHandover = await this.findOpenHandover(payload.thietBiId);
    const warehouseStatusId = await this.ensureWarehouseStatusId();

    const { data, error } = await this.client
      .from('lich_su_ban_giao')
      .update({
        ngay_thu_hoi: this.getToday(),
        ghi_chu: this.mergeNotes(openHandover.ghi_chu, payload.ghiChu),
      } satisfies Partial<TablesInsert<'lich_su_ban_giao'>>)
      .eq('id', openHandover.id)
      .select('*')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException(
        'Khong the cap nhat ban ghi thu hoi',
      );
    }

    const { error: updateDeviceError } = await this.client
      .from('thiet_bi')
      .update({
        nguoi_su_dung_id: null,
        tinh_trang_id: warehouseStatusId,
      } satisfies Partial<ThietBiRow>)
      .eq('id', payload.thietBiId);

    if (updateDeviceError) {
      throw new InternalServerErrorException(
        'Khong the cap nhat thong tin thiet bi sau thu hoi',
      );
    }

    return {
      message: 'Thu hoi thiet bi thanh cong',
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

  private async findOpenHandover(thietBiId: number): Promise<LichSuBanGiaoRow> {
    const { data, error } = await this.client
      .from('lich_su_ban_giao')
      .select('*')
      .eq('thiet_bi_id', thietBiId)
      .is('ngay_thu_hoi', null)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Khong the kiem tra lich su ban giao',
      );
    }

    if (!data) {
      throw new ConflictException(
        'Thiet bi hien khong co ban ghi ban giao dang mo',
      );
    }

    return data;
  }

  private async ensureWarehouseStatusId(): Promise<number> {
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
        normalizedCode === 'luu_kho' ||
        normalizedName === 'luu kho' ||
        normalizedName === 'luukho'
      );
    });

    if (matchedStatus) {
      return matchedStatus.id;
    }

    const { data: insertedStatus, error: insertError } = await this.client
      .from('tinh_trang_thiet_bi')
      .insert({
        ma_tinh_trang: 'LUU_KHO',
        ten_tinh_trang: 'Lưu kho',
      } satisfies TablesInsert<'tinh_trang_thiet_bi'>)
      .select('*')
      .single();

    if (insertError || !insertedStatus) {
      throw new InternalServerErrorException(
        'Khong the tao tinh trang Luu kho mac dinh',
      );
    }

    return insertedStatus.id;
  }

  private toDto(row: LichSuBanGiaoRow): ThuHoiDto {
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

  private mergeNotes(
    currentNote: string | null,
    nextNote?: string | null,
  ): string | null {
    const normalizedNote = nextNote?.trim();

    if (!normalizedNote) {
      return currentNote;
    }

    if (!currentNote) {
      return normalizedNote;
    }

    return `${currentNote}; ${normalizedNote}`;
  }

  private normalizeSearchValue(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toLowerCase();
  }
}
