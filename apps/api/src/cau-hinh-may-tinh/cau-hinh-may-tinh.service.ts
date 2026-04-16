import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type {
  CauHinhMayTinhDto,
  Tables,
  UpsertCauHinhMayTinhDto,
} from '@repo/shared';
import type { Database } from '@repo/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../database';

type CauHinhMayTinhRow = Tables<'cau_hinh_may_tinh'>;
type ThietBiRow = Tables<'thiet_bi'>;

@Injectable()
export class CauHinhMayTinhService {
  private readonly client: SupabaseClient<Database>;

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getClient();
  }

  async getByDeviceId(thietBiId: number): Promise<CauHinhMayTinhDto> {
    await this.ensureDeviceExists(thietBiId);

    const { data, error } = await this.client
      .from('cau_hinh_may_tinh')
      .select('*')
      .eq('thiet_bi_id', thietBiId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Khong the lay cau hinh may tinh');
    }

    if (!data) {
      throw new NotFoundException('Thiet bi chua co cau hinh may tinh');
    }

    return this.toDto(data);
  }

  async upsertByDeviceId(
    thietBiId: number,
    payload: UpsertCauHinhMayTinhDto,
  ): Promise<CauHinhMayTinhDto> {
    await this.ensureDeviceExists(thietBiId);
    const normalizedPayload = this.normalizePayload(payload);

    const { data: existingConfig, error: findError } = await this.client
      .from('cau_hinh_may_tinh')
      .select('*')
      .eq('thiet_bi_id', thietBiId)
      .maybeSingle();

    if (findError) {
      throw new InternalServerErrorException(
        'Khong the kiem tra cau hinh may tinh hien tai',
      );
    }

    if (existingConfig) {
      const { data, error } = await this.client
        .from('cau_hinh_may_tinh')
        .update({
          mainboard: normalizedPayload.mainboard,
          cpu: normalizedPayload.cpu,
          ram: normalizedPayload.ram,
          o_cung: normalizedPayload.oCung,
          he_dieu_hanh_id: normalizedPayload.heDieuHanhId,
          man_hinh: normalizedPayload.manHinh,
          phan_mem_diet_virus_id: normalizedPayload.phanMemDietVirusId,
          ghi_chu: normalizedPayload.ghiChu,
        })
        .eq('id', existingConfig.id)
        .select('*')
        .single();

      if (error || !data) {
        throw new InternalServerErrorException(
          'Khong the cap nhat cau hinh may tinh',
        );
      }

      return this.toDto(data);
    }

    const { data, error } = await this.client
      .from('cau_hinh_may_tinh')
      .insert({
        thiet_bi_id: thietBiId,
        mainboard: normalizedPayload.mainboard,
        cpu: normalizedPayload.cpu,
        ram: normalizedPayload.ram,
        o_cung: normalizedPayload.oCung,
        he_dieu_hanh_id: normalizedPayload.heDieuHanhId,
        man_hinh: normalizedPayload.manHinh,
        phan_mem_diet_virus_id: normalizedPayload.phanMemDietVirusId,
        ghi_chu: normalizedPayload.ghiChu,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Khong the tao cau hinh may tinh');
    }

    return this.toDto(data);
  }

  private async ensureDeviceExists(thietBiId: number): Promise<ThietBiRow> {
    const { data, error } = await this.client
      .from('thiet_bi')
      .select('*')
      .eq('id', thietBiId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Khong the kiem tra thiet bi');
    }

    if (!data) {
      throw new NotFoundException('Khong tim thay thiet bi');
    }

    return data;
  }

  private normalizePayload(
    payload: UpsertCauHinhMayTinhDto,
  ): UpsertCauHinhMayTinhDto {
    return {
      mainboard: this.normalizeOptionalText(payload.mainboard),
      cpu: this.normalizeOptionalText(payload.cpu),
      ram: this.normalizeOptionalText(payload.ram),
      oCung: this.normalizeOptionalText(payload.oCung),
      heDieuHanhId: payload.heDieuHanhId ?? null,
      manHinh: this.normalizeOptionalText(payload.manHinh),
      phanMemDietVirusId: payload.phanMemDietVirusId ?? null,
      ghiChu: this.normalizeOptionalText(payload.ghiChu),
    };
  }

  private toDto(row: CauHinhMayTinhRow): CauHinhMayTinhDto {
    return {
      id: row.id,
      thietBiId: row.thiet_bi_id,
      mainboard: row.mainboard,
      cpu: row.cpu,
      ram: row.ram,
      oCung: row.o_cung,
      heDieuHanhId: row.he_dieu_hanh_id,
      manHinh: row.man_hinh,
      phanMemDietVirusId: row.phan_mem_diet_virus_id,
      ghiChu: row.ghi_chu,
    };
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (value == null) {
      return null;
    }

    const normalizedValue = value.trim();
    return normalizedValue ? normalizedValue : null;
  }
}
