import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type {
  CloseSuaChuaBaoTriDto,
  CreateSuaChuaBaoTriDto,
  SuaChuaBaoTriActionResponseDto,
  SuaChuaBaoTriDto,
  SuaChuaBaoTriListQueryDto,
  SuaChuaBaoTriListResponseDto,
  SuaChuaBaoTriStatus,
  Tables,
  TablesInsert,
} from '@repo/shared';
import type { Database } from '@repo/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../database';

type SuaChuaBaoTriRow = Tables<'sua_chua_bao_tri'>;
type ThietBiRow = Tables<'thiet_bi'>;

@Injectable()
export class SuaChuaBaoTriService {
  private readonly client: SupabaseClient<Database>;

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getClient();
  }

  async findAll(
    query: SuaChuaBaoTriListQueryDto,
  ): Promise<SuaChuaBaoTriListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    let queryBuilder = this.client
      .from('sua_chua_bao_tri')
      .select('*', { count: 'exact' })
      .order('ngay_ghi_nhan', { ascending: false });

    if (query.status === 'dang_xu_ly') {
      queryBuilder = queryBuilder.is('ngay_sua_chua', null);
    }

    if (query.status === 'da_hoan_thanh') {
      queryBuilder = queryBuilder.not('ngay_sua_chua', 'is', null);
    }

    const { data, count, error } = await queryBuilder.range(
      offset,
      offset + limit - 1,
    );

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay danh sach phieu sua chua',
      );
    }

    const total = count ?? 0;

    return {
      items: (data ?? []).map((item) => this.toDto(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(
    payload: CreateSuaChuaBaoTriDto,
  ): Promise<SuaChuaBaoTriActionResponseDto> {
    await this.findDevice(payload.thietBiId);

    const insertPayload: TablesInsert<'sua_chua_bao_tri'> = {
      thiet_bi_id: payload.thietBiId,
      mo_ta_loi: this.normalizeOptionalText(payload.moTaLoi),
      loai_xu_ly: this.normalizeOptionalText(payload.loaiXuLy),
      don_vi_sua_chua: this.normalizeOptionalText(payload.donViSuaChua),
      ghi_chu: this.normalizeOptionalText(payload.ghiChu),
      ngay_ghi_nhan: this.getToday(),
      chi_phi: 0,
    };

    const { data, error } = await this.client
      .from('sua_chua_bao_tri')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Khong the tao phieu sua chua');
    }

    return {
      message: 'Tao phieu sua chua thanh cong',
      ticket: this.toDto(data),
    };
  }

  async close(
    id: number,
    payload: CloseSuaChuaBaoTriDto,
  ): Promise<SuaChuaBaoTriActionResponseDto> {
    const currentTicket = await this.findTicket(id);

    if (currentTicket.ngay_sua_chua) {
      throw new ConflictException('Phieu sua chua da duoc dong truoc do');
    }

    const { data, error } = await this.client
      .from('sua_chua_bao_tri')
      .update({
        ngay_sua_chua: this.getToday(),
        chi_phi: payload.chiPhi,
        ket_qua_xu_ly: this.normalizeOptionalText(payload.ketQuaXuLy),
        ghi_chu: this.mergeNotes(currentTicket.ghi_chu, payload.ghiChu),
      } satisfies Partial<TablesInsert<'sua_chua_bao_tri'>>)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Khong the dong phieu sua chua');
    }

    const warehouseStatusId = await this.ensureWarehouseStatusId();
    await this.updateDeviceStatus(currentTicket.thiet_bi_id, warehouseStatusId);

    return {
      message: 'Dong phieu sua chua thanh cong',
      ticket: this.toDto(data),
    };
  }

  private async findTicket(id: number): Promise<SuaChuaBaoTriRow> {
    const { data, error } = await this.client
      .from('sua_chua_bao_tri')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay thong tin phieu sua chua',
      );
    }

    if (!data) {
      throw new NotFoundException('Khong tim thay phieu sua chua');
    }

    return data;
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

  private async updateDeviceStatus(
    thietBiId: number,
    statusId: number,
  ): Promise<void> {
    const { error } = await this.client
      .from('thiet_bi')
      .update({
        tinh_trang_id: statusId,
      } satisfies Partial<ThietBiRow>)
      .eq('id', thietBiId);

    if (error) {
      throw new InternalServerErrorException(
        'Khong the cap nhat tinh trang thiet bi',
      );
    }
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

  private toDto(row: SuaChuaBaoTriRow): SuaChuaBaoTriDto {
    const status: SuaChuaBaoTriStatus = row.ngay_sua_chua
      ? 'da_hoan_thanh'
      : 'dang_xu_ly';

    return {
      id: row.id,
      thietBiId: row.thiet_bi_id,
      ngayGhiNhan: row.ngay_ghi_nhan,
      ngaySuaChua: row.ngay_sua_chua,
      moTaLoi: row.mo_ta_loi,
      loaiXuLy: row.loai_xu_ly,
      donViSuaChua: row.don_vi_sua_chua,
      chiPhi: row.chi_phi,
      ketQuaXuLy: row.ket_qua_xu_ly,
      ghiChu: row.ghi_chu,
      status,
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
