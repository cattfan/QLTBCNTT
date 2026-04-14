import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateLoaiThietBiDto,
  DeleteLoaiThietBiResponseDto,
  LoaiThietBiDto,
  LoaiThietBiListResponseDto,
  LoaiThietBiQueryDto,
  Tables,
  TablesInsert,
  TablesUpdate,
  UpdateLoaiThietBiDto,
} from '@repo/shared';
import type { Database } from '@repo/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../database';

type LoaiThietBiRow = Tables<'loai_thiet_bi'>;
type LoaiThietBiInsert = TablesInsert<'loai_thiet_bi'>;
type LoaiThietBiUpdate = TablesUpdate<'loai_thiet_bi'>;

interface CountResult {
  count: number | null;
  error: { message: string } | null;
}

@Injectable()
export class LoaiThietBiService {
  private readonly client: SupabaseClient<Database>;

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getClient();
  }

  async findAll(
    query: LoaiThietBiQueryDto,
  ): Promise<LoaiThietBiListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const search = query.search?.trim();

    let queryBuilder = this.client
      .from('loai_thiet_bi')
      .select('*', { count: 'exact' });

    if (search) {
      queryBuilder = queryBuilder.ilike('ten_loai', `%${search}%`);
    }

    const { data, count, error } = await queryBuilder
      .range(offset, offset + limit - 1)
      .order('id', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        'Không thể lấy danh sách loại thiết bị',
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

  async findById(id: number): Promise<LoaiThietBiDto> {
    const row = await this.findCategoryRow(id);
    return this.toDto(row);
  }

  async create(payload: CreateLoaiThietBiDto): Promise<LoaiThietBiDto> {
    const normalizedPayload = this.normalizePayload(payload);
    await this.ensureCodeAvailable(normalizedPayload.maLoai);

    const { data, error } = await this.client
      .from('loai_thiet_bi')
      .insert(this.toInsert(normalizedPayload))
      .select('*')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Không thể thêm loại thiết bị');
    }

    return this.toDto(data);
  }

  async update(
    id: number,
    payload: UpdateLoaiThietBiDto,
  ): Promise<LoaiThietBiDto> {
    await this.findCategoryRow(id);

    const normalizedPayload = this.normalizePayload(payload);
    await this.ensureCodeAvailable(normalizedPayload.maLoai, id);

    const { data, error } = await this.client
      .from('loai_thiet_bi')
      .update(this.toUpdate(normalizedPayload))
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException(
        'Không thể cập nhật loại thiết bị',
      );
    }

    return this.toDto(data);
  }

  async remove(id: number): Promise<DeleteLoaiThietBiResponseDto> {
    await this.findCategoryRow(id);
    await this.ensureCategoryNotLinked(id);

    const { error } = await this.client
      .from('loai_thiet_bi')
      .delete()
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException('Không thể xóa loại thiết bị');
    }

    return {
      message: 'Xóa loại thiết bị thành công',
    };
  }

  private async findCategoryRow(id: number): Promise<LoaiThietBiRow> {
    const { data, error } = await this.client
      .from('loai_thiet_bi')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết loại thiết bị',
      );
    }

    if (!data) {
      throw new NotFoundException('Không tìm thấy loại thiết bị');
    }

    return data;
  }

  private async ensureCodeAvailable(
    maLoai: string,
    currentCategoryId?: number,
  ): Promise<void> {
    let queryBuilder = this.client
      .from('loai_thiet_bi')
      .select('id')
      .eq('ma_loai', maLoai);

    if (currentCategoryId !== undefined) {
      queryBuilder = queryBuilder.neq('id', currentCategoryId);
    }

    const { data, error } = await queryBuilder.limit(1);

    if (error) {
      throw new InternalServerErrorException(
        'Không thể kiểm tra mã loại thiết bị',
      );
    }

    if ((data ?? []).length > 0) {
      throw new ConflictException('Mã danh mục đã tồn tại');
    }
  }

  private async ensureCategoryNotLinked(id: number): Promise<void> {
    const result = (await this.client
      .from('thiet_bi')
      .select('id', { count: 'exact', head: true })
      .eq('loai_thiet_bi_id', id)) as CountResult;

    if (result.error) {
      throw new InternalServerErrorException(
        'Không thể kiểm tra liên kết loại thiết bị',
      );
    }

    if ((result.count ?? 0) > 0) {
      throw new ConflictException(
        'Không thể xóa loại thiết bị đang có thiết bị liên kết',
      );
    }
  }

  private normalizePayload(
    payload: CreateLoaiThietBiDto | UpdateLoaiThietBiDto,
  ): CreateLoaiThietBiDto {
    const maLoai = this.requireNonEmpty(payload.maLoai, 'Mã danh mục');
    const tenLoai = this.requireNonEmpty(payload.tenLoai, 'Tên loại thiết bị');
    const ghiChu = this.normalizeOptionalText(payload.ghiChu);

    return {
      maLoai,
      tenLoai,
      ghiChu,
    };
  }

  private toDto(row: LoaiThietBiRow): LoaiThietBiDto {
    return {
      id: row.id,
      maLoai: row.ma_loai ?? '',
      tenLoai: row.ten_loai,
      ghiChu: row.ghi_chu,
    };
  }

  private toInsert(payload: CreateLoaiThietBiDto): LoaiThietBiInsert {
    return {
      ma_loai: payload.maLoai,
      ten_loai: payload.tenLoai,
      ghi_chu: payload.ghiChu ?? null,
    };
  }

  private toUpdate(payload: UpdateLoaiThietBiDto): LoaiThietBiUpdate {
    return {
      ma_loai: payload.maLoai,
      ten_loai: payload.tenLoai,
      ghi_chu: payload.ghiChu ?? null,
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
