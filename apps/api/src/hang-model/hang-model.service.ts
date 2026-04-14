import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import type {
  CreateHangModelDto,
  DeleteHangModelResponseDto,
  HangModelDto,
  HangModelListResponseDto,
  HangModelQueryDto,
  Tables,
  UpdateHangModelDto,
} from '@repo/shared';
import { BaseCrudService } from '../common';
import { SupabaseService } from '../database';

type HangModelRow = Tables<'hang_model'>;

interface CountResult {
  count: number | null;
  error: { message: string } | null;
}

@Injectable()
export class HangModelService extends BaseCrudService<HangModelRow> {
  protected tableName = 'hang_model';
  protected searchColumns = ['ten_hang', 'ten_model'];

  constructor(protected readonly supabaseService: SupabaseService) {
    super(supabaseService);
  }

  async list(query: HangModelQueryDto): Promise<HangModelListResponseDto> {
    const result = await super.findAll(query);

    return {
      items: result.items.map((item) => this.toDto(item)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async getById(id: number): Promise<HangModelDto> {
    const row = await super.findById(id);
    return this.toDto(row);
  }

  async createItem(payload: CreateHangModelDto): Promise<HangModelDto> {
    const normalizedPayload = this.normalizePayload(payload);
    const row = await super.create({
      ten_hang: normalizedPayload.tenHang,
      ten_model: normalizedPayload.tenModel,
      ghi_chu: normalizedPayload.ghiChu,
    });

    return this.toDto(row);
  }

  async updateItem(
    id: number,
    payload: UpdateHangModelDto,
  ): Promise<HangModelDto> {
    await super.findById(id);

    const normalizedPayload = this.normalizePayload(payload);
    const row = await super.update(id, {
      ten_hang: normalizedPayload.tenHang,
      ten_model: normalizedPayload.tenModel,
      ghi_chu: normalizedPayload.ghiChu,
    });

    return this.toDto(row);
  }

  async removeItem(id: number): Promise<DeleteHangModelResponseDto> {
    await this.ensureModelNotLinked(id);
    await super.remove(id);

    return {
      message: 'Xóa hãng/model thành công',
    };
  }

  private async ensureModelNotLinked(id: number): Promise<void> {
    const result = (await this.client
      .from('thiet_bi')
      .select('id', { count: 'exact', head: true })
      .eq('hang_model_id', id)) as CountResult;

    if (result.error) {
      throw new InternalServerErrorException(
        'Không thể kiểm tra liên kết hãng/model',
      );
    }

    if ((result.count ?? 0) > 0) {
      throw new ConflictException(
        'Không thể xóa hãng/model đang có thiết bị liên kết',
      );
    }
  }

  private normalizePayload(
    payload: CreateHangModelDto | UpdateHangModelDto,
  ): CreateHangModelDto {
    const tenHang = this.requireNonEmpty(payload.tenHang, 'Tên hãng');
    const tenModel = this.normalizeOptionalText(payload.tenModel);
    const ghiChu = this.normalizeOptionalText(payload.ghiChu);

    return {
      tenHang,
      tenModel,
      ghiChu,
    };
  }

  private toDto(row: HangModelRow): HangModelDto {
    return {
      id: row.id,
      tenHang: row.ten_hang,
      tenModel: row.ten_model,
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
