import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreatePhongBanDto,
  DeletePhongBanResponseDto,
  PhongBanDto,
  PhongBanListResponseDto,
  PhongBanQueryDto,
  Tables,
  TablesInsert,
  TablesUpdate,
  UpdatePhongBanDto,
} from '@repo/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/shared';
import { SupabaseService } from '../database';

type PhongBanRow = Tables<'phong_ban'>;
type PhongBanInsert = TablesInsert<'phong_ban'>;
type PhongBanUpdate = TablesUpdate<'phong_ban'>;

interface CountResult {
  count: number | null;
  error: { message: string } | null;
}

@Injectable()
export class PhongBanService {
  private readonly client: SupabaseClient<Database>;

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getClient();
  }

  async findAll(query: PhongBanQueryDto): Promise<PhongBanListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const search = query.search?.trim();

    let queryBuilder = this.client
      .from('phong_ban')
      .select('*', { count: 'exact' });

    if (search) {
      queryBuilder = queryBuilder.or(
        `ma_phong_ban.ilike.%${search}%,ten_phong_ban.ilike.%${search}%`,
      );
    }

    const { data, count, error } = await queryBuilder
      .range(offset, offset + limit - 1)
      .order('id', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        'Không thể lấy danh sách phòng ban',
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

  async findById(id: number): Promise<PhongBanDto> {
    const row = await this.findDepartmentRow(id);
    return this.toDto(row);
  }

  async create(payload: CreatePhongBanDto): Promise<PhongBanDto> {
    const normalizedPayload = this.normalizePayload(payload);
    await this.ensureCodeAvailable(normalizedPayload.maPhongBan);

    const { data, error } = await this.client
      .from('phong_ban')
      .insert(this.toInsert(normalizedPayload))
      .select('*')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Không thể thêm phòng ban');
    }

    return this.toDto(data);
  }

  async update(id: number, payload: UpdatePhongBanDto): Promise<PhongBanDto> {
    await this.findDepartmentRow(id);

    const normalizedPayload = this.normalizePayload(payload);
    await this.ensureCodeAvailable(normalizedPayload.maPhongBan, id);

    const { data, error } = await this.client
      .from('phong_ban')
      .update(this.toUpdate(normalizedPayload))
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Không thể cập nhật phòng ban');
    }

    return this.toDto(data);
  }

  async remove(id: number): Promise<DeletePhongBanResponseDto> {
    await this.findDepartmentRow(id);
    await this.ensureDepartmentNotLinked(id);

    const { error } = await this.client.from('phong_ban').delete().eq('id', id);

    if (error) {
      throw new InternalServerErrorException('Không thể xóa phòng ban');
    }

    return {
      message: 'Xóa phòng ban thành công',
    };
  }

  private async findDepartmentRow(id: number): Promise<PhongBanRow> {
    const { data, error } = await this.client
      .from('phong_ban')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết phòng ban',
      );
    }

    if (!data) {
      throw new NotFoundException('Không tìm thấy phòng ban');
    }

    return data;
  }

  private async ensureCodeAvailable(
    maPhongBan: string,
    currentDepartmentId?: number,
  ): Promise<void> {
    let queryBuilder = this.client
      .from('phong_ban')
      .select('id')
      .eq('ma_phong_ban', maPhongBan);

    if (currentDepartmentId !== undefined) {
      queryBuilder = queryBuilder.neq('id', currentDepartmentId);
    }

    const { data, error } = await queryBuilder.limit(1);

    if (error) {
      throw new InternalServerErrorException('Không thể kiểm tra mã phòng ban');
    }

    if ((data ?? []).length > 0) {
      throw new ConflictException('Mã phòng ban đã tồn tại');
    }
  }

  private async ensureDepartmentNotLinked(id: number): Promise<void> {
    const [employeeResult, deviceResult] = await Promise.all([
      this.countRelatedRows('nguoi_dung', id),
      this.countRelatedRows('thiet_bi', id),
    ]);

    if (employeeResult > 0 || deviceResult > 0) {
      throw new ConflictException(
        'Không thể xóa phòng ban đang có nhân viên hoặc thiết bị liên kết',
      );
    }
  }

  private async countRelatedRows(
    tableName: 'nguoi_dung' | 'thiet_bi',
    phongBanId: number,
  ): Promise<number> {
    const columnName = 'phong_ban_id';
    const result = (await this.client
      .from(tableName)
      .select('id', { count: 'exact', head: true })
      .eq(columnName, phongBanId)) as CountResult;

    if (result.error) {
      throw new InternalServerErrorException(
        'Không thể kiểm tra liên kết phòng ban',
      );
    }

    return result.count ?? 0;
  }

  private normalizePayload(
    payload: CreatePhongBanDto | UpdatePhongBanDto,
  ): CreatePhongBanDto {
    const maPhongBan = this.requireNonEmpty(payload.maPhongBan, 'Mã phòng ban');
    const tenPhongBan = this.requireNonEmpty(
      payload.tenPhongBan,
      'Tên phòng ban',
    );
    const ghiChu = this.normalizeOptionalText(payload.ghiChu);

    return {
      maPhongBan,
      tenPhongBan,
      ghiChu,
    };
  }

  private toDto(row: PhongBanRow): PhongBanDto {
    return {
      id: row.id,
      maPhongBan: row.ma_phong_ban ?? '',
      tenPhongBan: row.ten_phong_ban,
      ghiChu: row.ghi_chu,
    };
  }

  private toInsert(payload: CreatePhongBanDto): PhongBanInsert {
    return {
      ma_phong_ban: payload.maPhongBan,
      ten_phong_ban: payload.tenPhongBan,
      ghi_chu: payload.ghiChu ?? null,
    };
  }

  private toUpdate(payload: UpdatePhongBanDto): PhongBanUpdate {
    return {
      ma_phong_ban: payload.maPhongBan,
      ten_phong_ban: payload.tenPhongBan,
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
