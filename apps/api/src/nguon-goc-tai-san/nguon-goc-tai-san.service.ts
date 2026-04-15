import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import type {
  CreateNguonGocTaiSanDto,
  DeleteNguonGocTaiSanResponseDto,
  NguonGocTaiSanDto,
  NguonGocTaiSanListResponseDto,
  NguonGocTaiSanQueryDto,
  Tables,
  UpdateNguonGocTaiSanDto,
} from '@repo/shared';
import { BaseCrudService } from '../common';
import { SupabaseService } from '../database';

type NguonGocTaiSanRow = Tables<'nguon_goc_tai_san'>;

interface CountResult {
  count: number | null;
  error: { message: string } | null;
}

@Injectable()
export class NguonGocTaiSanService extends BaseCrudService<NguonGocTaiSanRow> {
  protected tableName = 'nguon_goc_tai_san';
  protected searchColumns = ['ma_nguon_goc', 'ten_nguon_goc'];

  constructor(protected readonly supabaseService: SupabaseService) {
    super(supabaseService);
  }

  async list(
    query: NguonGocTaiSanQueryDto,
  ): Promise<NguonGocTaiSanListResponseDto> {
    const result = await super.findAll(query);

    return {
      items: result.items.map((item) => this.toDto(item)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async getById(id: number): Promise<NguonGocTaiSanDto> {
    const row = await super.findById(id);
    return this.toDto(row);
  }

  async createItem(
    payload: CreateNguonGocTaiSanDto,
  ): Promise<NguonGocTaiSanDto> {
    const normalizedPayload = this.normalizePayload(payload);
    const row = await super.create({
      ma_nguon_goc: normalizedPayload.maNguonGoc,
      ten_nguon_goc: normalizedPayload.tenNguonGoc,
      ghi_chu: normalizedPayload.ghiChu,
    });

    return this.toDto(row);
  }

  async updateItem(
    id: number,
    payload: UpdateNguonGocTaiSanDto,
  ): Promise<NguonGocTaiSanDto> {
    await super.findById(id);

    const normalizedPayload = this.normalizePayload(payload);
    const row = await super.update(id, {
      ma_nguon_goc: normalizedPayload.maNguonGoc,
      ten_nguon_goc: normalizedPayload.tenNguonGoc,
      ghi_chu: normalizedPayload.ghiChu,
    });

    return this.toDto(row);
  }

  async removeItem(id: number): Promise<DeleteNguonGocTaiSanResponseDto> {
    await this.ensureAssetOriginNotLinked(id);
    await super.remove(id);

    return {
      message: 'Xóa nguồn gốc tài sản thành công',
    };
  }

  private async ensureAssetOriginNotLinked(id: number): Promise<void> {
    const result = (await this.client
      .from('thiet_bi')
      .select('id', { count: 'exact', head: true })
      .eq('nguon_goc_id', id)) as CountResult;

    if (result.error) {
      throw new InternalServerErrorException(
        'Không thể kiểm tra liên kết nguồn gốc tài sản',
      );
    }

    if ((result.count ?? 0) > 0) {
      throw new ConflictException(
        'Không thể xóa nguồn gốc tài sản đang có thiết bị liên kết',
      );
    }
  }

  private normalizePayload(
    payload: CreateNguonGocTaiSanDto | UpdateNguonGocTaiSanDto,
  ): CreateNguonGocTaiSanDto {
    const tenNguonGoc = this.requireNonEmpty(
      payload.tenNguonGoc,
      'Tên nguồn gốc tài sản',
    );
    const maNguonGoc = this.normalizeOptionalText(payload.maNguonGoc);
    const ghiChu = this.normalizeOptionalText(payload.ghiChu);

    return {
      maNguonGoc,
      tenNguonGoc,
      ghiChu,
    };
  }

  private toDto(row: NguonGocTaiSanRow): NguonGocTaiSanDto {
    return {
      id: row.id,
      maNguonGoc: row.ma_nguon_goc,
      tenNguonGoc: row.ten_nguon_goc,
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
