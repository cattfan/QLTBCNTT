import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import type {
  CreateThietBiDto,
  DeleteThietBiResponseDto,
  Tables,
  ThietBiDto,
  ThietBiListResponseDto,
  ThietBiQueryDto,
  UpdateThietBiDto,
} from '@repo/shared';
import { BaseCrudService } from '../common';
import { SupabaseService } from '../database';

type ThietBiRow = Tables<'thiet_bi'>;

interface CountResult {
  count: number | null;
  error: { message: string } | null;
}

@Injectable()
export class ThietBiService extends BaseCrudService<ThietBiRow> {
  protected tableName = 'thiet_bi';
  protected searchColumns = ['ma_thiet_bi', 'ten_thiet_bi', 'serial'];

  constructor(protected readonly supabaseService: SupabaseService) {
    super(supabaseService);
  }

  async list(query: ThietBiQueryDto): Promise<ThietBiListResponseDto> {
    if (
      query.phongBanId === undefined &&
      query.tinhTrangId === undefined &&
      query.loaiThietBiId === undefined
    ) {
      const result = await super.findAll(query);

      return {
        items: result.items.map((item) => this.toDto(item)),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const search = query.search?.trim();

    let queryBuilder = this.client
      .from('thiet_bi')
      .select('*', { count: 'exact' });

    if (query.phongBanId !== undefined) {
      queryBuilder = queryBuilder.eq('phong_ban_id', query.phongBanId);
    }

    if (query.tinhTrangId !== undefined) {
      queryBuilder = queryBuilder.eq('tinh_trang_id', query.tinhTrangId);
    }

    if (query.loaiThietBiId !== undefined) {
      queryBuilder = queryBuilder.eq('loai_thiet_bi_id', query.loaiThietBiId);
    }

    if (search) {
      queryBuilder = queryBuilder.or(
        `ma_thiet_bi.ilike.%${search}%,ten_thiet_bi.ilike.%${search}%,serial.ilike.%${search}%`,
      );
    }

    const { data, count, error } = await queryBuilder
      .range(offset, offset + limit - 1)
      .order('id', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay danh sach thiet bi',
      );
    }

    const total = count ?? 0;
    const rows = (data ?? []) as ThietBiRow[];

    return {
      items: rows.map((item) => this.toDto(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: number): Promise<ThietBiDto> {
    const row = await super.findById(id);
    return this.toDto(row);
  }

  async createItem(payload: CreateThietBiDto): Promise<ThietBiDto> {
    const normalizedPayload = this.normalizePayload(payload);
    await this.ensureSerialAvailable(normalizedPayload.serial ?? null);

    const row = await super.create(
      this.toPersistencePayload(normalizedPayload),
    );
    return this.toDto(row);
  }

  async updateItem(id: number, payload: UpdateThietBiDto): Promise<ThietBiDto> {
    await super.findById(id);

    const normalizedPayload = this.normalizePayload(payload);
    await this.ensureSerialAvailable(normalizedPayload.serial ?? null, id);

    const row = await super.update(
      id,
      this.toPersistencePayload(normalizedPayload),
    );
    return this.toDto(row);
  }

  async removeItem(id: number): Promise<DeleteThietBiResponseDto> {
    await this.ensureDeviceNotAssigned(id);
    await this.ensureDeviceNotUnderRepair(id);
    await super.remove(id);

    return {
      message: 'Xoa thiet bi thanh cong',
    };
  }

  private async ensureSerialAvailable(
    serial: string | null,
    currentDeviceId?: number,
  ): Promise<void> {
    if (!serial) {
      return;
    }

    let queryBuilder = this.client
      .from('thiet_bi')
      .select('id')
      .eq('serial', serial);

    if (currentDeviceId !== undefined) {
      queryBuilder = queryBuilder.neq('id', currentDeviceId);
    }

    const { data, error } = await queryBuilder.limit(1);

    if (error) {
      throw new InternalServerErrorException('Khong the kiem tra serial');
    }

    if ((data ?? []).length > 0) {
      throw new ConflictException('Serial da ton tai');
    }
  }

  private async ensureDeviceNotAssigned(id: number): Promise<void> {
    const result = (await this.client
      .from('lich_su_ban_giao')
      .select('id', { count: 'exact', head: true })
      .eq('thiet_bi_id', id)
      .is('ngay_thu_hoi', null)) as CountResult;

    if (result.error) {
      throw new InternalServerErrorException(
        'Khong the kiem tra ban giao thiet bi',
      );
    }

    if ((result.count ?? 0) > 0) {
      throw new ConflictException('Khong the xoa thiet bi dang duoc ban giao');
    }
  }

  private async ensureDeviceNotUnderRepair(id: number): Promise<void> {
    const result = (await this.client
      .from('sua_chua_bao_tri')
      .select('id', { count: 'exact', head: true })
      .eq('thiet_bi_id', id)
      .is('ngay_sua_chua', null)) as CountResult;

    if (result.error) {
      throw new InternalServerErrorException(
        'Khong the kiem tra trang thai sua chua',
      );
    }

    if ((result.count ?? 0) > 0) {
      throw new ConflictException('Khong the xoa thiet bi dang sua chua');
    }
  }

  private normalizePayload(
    payload: CreateThietBiDto | UpdateThietBiDto,
  ): CreateThietBiDto {
    return {
      maThietBi: this.requireNonEmpty(payload.maThietBi, 'Ma thiet bi'),
      tenThietBi: this.requireNonEmpty(payload.tenThietBi, 'Ten thiet bi'),
      serial: this.normalizeOptionalText(payload.serial),
      loaiThietBiId: this.requirePositiveInt(
        payload.loaiThietBiId,
        'Loai thiet bi',
      ),
      hangModelId: payload.hangModelId ?? null,
      nguonGocId: payload.nguonGocId ?? null,
      phongBanId: payload.phongBanId ?? null,
      nguoiSuDungId: payload.nguoiSuDungId ?? null,
      tinhTrangId: payload.tinhTrangId ?? null,
      namTrangBi: payload.namTrangBi ?? null,
      ngayTiepNhan: payload.ngayTiepNhan ?? null,
      laThietBiDungChung: payload.laThietBiDungChung ?? null,
      thietBiMat: payload.thietBiMat ?? null,
      ghiChu: this.normalizeOptionalText(payload.ghiChu),
    };
  }

  private toPersistencePayload(payload: CreateThietBiDto): Partial<ThietBiRow> {
    return {
      ma_thiet_bi: payload.maThietBi,
      ten_thiet_bi: payload.tenThietBi,
      serial: payload.serial,
      loai_thiet_bi_id: payload.loaiThietBiId,
      hang_model_id: payload.hangModelId ?? null,
      nguon_goc_id: payload.nguonGocId ?? null,
      phong_ban_id: payload.phongBanId ?? null,
      nguoi_su_dung_id: payload.nguoiSuDungId ?? null,
      tinh_trang_id: payload.tinhTrangId ?? null,
      nam_trang_bi: payload.namTrangBi ?? null,
      ngay_tiep_nhan: payload.ngayTiepNhan ?? null,
      la_thiet_bi_dung_chung: payload.laThietBiDungChung ?? null,
      thiet_bi_mat: payload.thietBiMat ?? null,
      ghi_chu: payload.ghiChu ?? null,
    };
  }

  private toDto(row: ThietBiRow): ThietBiDto {
    return {
      id: row.id,
      maThietBi: row.ma_thiet_bi,
      tenThietBi: row.ten_thiet_bi,
      serial: row.serial,
      loaiThietBiId: row.loai_thiet_bi_id,
      hangModelId: row.hang_model_id,
      nguonGocId: row.nguon_goc_id,
      phongBanId: row.phong_ban_id,
      nguoiSuDungId: row.nguoi_su_dung_id,
      tinhTrangId: row.tinh_trang_id,
      namTrangBi: row.nam_trang_bi,
      ngayTiepNhan: row.ngay_tiep_nhan,
      laThietBiDungChung: row.la_thiet_bi_dung_chung,
      thietBiMat: row.thiet_bi_mat,
      ghiChu: row.ghi_chu,
    };
  }

  private requireNonEmpty(value: string, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} khong hop le`);
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new BadRequestException(`${fieldName} khong duoc de trong`);
    }

    return normalizedValue;
  }

  private requirePositiveInt(value: number, fieldName: string): number {
    if (!Number.isInteger(value) || value < 1) {
      throw new BadRequestException(`${fieldName} khong hop le`);
    }

    return value;
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (value == null) {
      return null;
    }

    const normalizedValue = value.trim();
    return normalizedValue ? normalizedValue : null;
  }
}
