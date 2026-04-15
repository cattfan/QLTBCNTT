import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import type {
  CreateTinhTrangThietBiDto,
  DeleteTinhTrangThietBiResponseDto,
  Tables,
  TinhTrangThietBiDto,
  TinhTrangThietBiListResponseDto,
  TinhTrangThietBiQueryDto,
  UpdateTinhTrangThietBiDto,
} from '@repo/shared';
import { BaseCrudService } from '../common';
import { SupabaseService } from '../database';

type TinhTrangThietBiRow = Tables<'tinh_trang_thiet_bi'>;

interface CountResult {
  count: number | null;
  error: { message: string } | null;
}

const DEFAULT_DEVICE_STATUSES: Array<CreateTinhTrangThietBiDto> = [
  {
    maTinhTrang: 'DANG_SU_DUNG',
    tenTinhTrang: 'Đang sử dụng',
    ghiChu: null,
  },
  {
    maTinhTrang: 'LUU_KHO',
    tenTinhTrang: 'Lưu kho',
    ghiChu: null,
  },
  {
    maTinhTrang: 'THANH_LY',
    tenTinhTrang: 'Thanh lý',
    ghiChu: null,
  },
];

@Injectable()
export class TinhTrangThietBiService extends BaseCrudService<TinhTrangThietBiRow> {
  protected tableName = 'tinh_trang_thiet_bi';
  protected searchColumns = ['ten_tinh_trang'];

  constructor(protected readonly supabaseService: SupabaseService) {
    super(supabaseService);
  }

  async list(
    query: TinhTrangThietBiQueryDto,
  ): Promise<TinhTrangThietBiListResponseDto> {
    await this.ensureDefaultStatuses();
    const result = await super.findAll(query);

    return {
      items: result.items.map((item) => this.toDto(item)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async getById(id: number): Promise<TinhTrangThietBiDto> {
    await this.ensureDefaultStatuses();
    const row = await super.findById(id);
    return this.toDto(row);
  }

  async createItem(
    payload: CreateTinhTrangThietBiDto,
  ): Promise<TinhTrangThietBiDto> {
    await this.ensureDefaultStatuses();
    const normalizedPayload = this.normalizePayload(payload);
    const row = await super.create({
      ma_tinh_trang: normalizedPayload.maTinhTrang,
      ten_tinh_trang: normalizedPayload.tenTinhTrang,
      ghi_chu: normalizedPayload.ghiChu,
    });

    return this.toDto(row);
  }

  async updateItem(
    id: number,
    payload: UpdateTinhTrangThietBiDto,
  ): Promise<TinhTrangThietBiDto> {
    await this.ensureDefaultStatuses();
    await super.findById(id);

    const normalizedPayload = this.normalizePayload(payload);
    const row = await super.update(id, {
      ma_tinh_trang: normalizedPayload.maTinhTrang,
      ten_tinh_trang: normalizedPayload.tenTinhTrang,
      ghi_chu: normalizedPayload.ghiChu,
    });

    return this.toDto(row);
  }

  async removeItem(id: number): Promise<DeleteTinhTrangThietBiResponseDto> {
    await this.ensureDefaultStatuses();
    await this.ensureStatusNotLinked(id);
    await super.remove(id);

    return {
      message: 'Xóa tình trạng thiết bị thành công',
    };
  }

  private async ensureDefaultStatuses(): Promise<void> {
    const { data, error } = await this.client
      .from('tinh_trang_thiet_bi')
      .select('ma_tinh_trang');

    if (error) {
      throw new InternalServerErrorException(
        'Không thể kiểm tra danh mục tình trạng thiết bị',
      );
    }

    const existingCodes = new Set(
      ((data ?? []) as Array<{ ma_tinh_trang: string | null }>)
        .map((item) => item.ma_tinh_trang)
        .filter((code): code is string => typeof code === 'string' && !!code),
    );

    const missingStatuses = DEFAULT_DEVICE_STATUSES.filter(
      (status) => !status.maTinhTrang || !existingCodes.has(status.maTinhTrang),
    ).map((status) => ({
      ma_tinh_trang: status.maTinhTrang,
      ten_tinh_trang: status.tenTinhTrang,
      ghi_chu: status.ghiChu ?? null,
    }));

    if (missingStatuses.length === 0) {
      return;
    }

    const { error: insertError } = await this.client
      .from('tinh_trang_thiet_bi')
      .insert(missingStatuses);

    if (insertError) {
      throw new InternalServerErrorException(
        'Không thể khởi tạo tình trạng thiết bị mặc định',
      );
    }
  }

  private async ensureStatusNotLinked(id: number): Promise<void> {
    const result = (await this.client
      .from('thiet_bi')
      .select('id', { count: 'exact', head: true })
      .eq('tinh_trang_id', id)) as CountResult;

    if (result.error) {
      throw new InternalServerErrorException(
        'Không thể kiểm tra liên kết tình trạng thiết bị',
      );
    }

    if ((result.count ?? 0) > 0) {
      throw new ConflictException(
        'Không thể xóa tình trạng thiết bị đang có thiết bị liên kết',
      );
    }
  }

  private normalizePayload(
    payload: CreateTinhTrangThietBiDto | UpdateTinhTrangThietBiDto,
  ): CreateTinhTrangThietBiDto {
    const tenTinhTrang = this.requireNonEmpty(
      payload.tenTinhTrang,
      'Tên tình trạng thiết bị',
    );
    const maTinhTrang = this.normalizeOptionalText(payload.maTinhTrang);
    const ghiChu = this.normalizeOptionalText(payload.ghiChu);

    return {
      maTinhTrang,
      tenTinhTrang,
      ghiChu,
    };
  }

  private toDto(row: TinhTrangThietBiRow): TinhTrangThietBiDto {
    return {
      id: row.id,
      maTinhTrang: row.ma_tinh_trang,
      tenTinhTrang: row.ten_tinh_trang,
      ghiChu: row.ghi_chu,
    };
  }

  private requireNonEmpty(value: string, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} không hợp lệ`);
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new BadRequestException(`${fieldName} không được để trống`);
    }

    return normalizedValue;
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (value == null) {
      return null;
    }

    const normalizedValue = value.trim();
    return normalizedValue ? normalizedValue : null;
  }
}
