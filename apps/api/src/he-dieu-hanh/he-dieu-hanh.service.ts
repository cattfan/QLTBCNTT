import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateHeDieuHanhDto,
  DeleteHeDieuHanhResponseDto,
  HeDieuHanhDto,
  HeDieuHanhListResponseDto,
  HeDieuHanhQueryDto,
  Tables,
  TablesInsert,
  TablesUpdate,
  UpdateHeDieuHanhDto,
} from '@repo/shared';
import type { Database } from '@repo/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../database';

type HeDieuHanhRow = Tables<'he_dieu_hanh'>;
type HeDieuHanhInsert = TablesInsert<'he_dieu_hanh'>;
type HeDieuHanhUpdate = TablesUpdate<'he_dieu_hanh'>;

interface CountResult {
  count: number | null;
  error: { message: string } | null;
}

@Injectable()
export class HeDieuHanhService {
  private readonly client: SupabaseClient<Database>;

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getClient();
  }

  async findAll(query: HeDieuHanhQueryDto): Promise<HeDieuHanhListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const search = query.search?.trim();

    let queryBuilder = this.client
      .from('he_dieu_hanh')
      .select('*', { count: 'exact' });

    if (search) {
      queryBuilder = queryBuilder.ilike('ten_he_dieu_hanh', `%${search}%`);
    }

    const { data, count, error } = await queryBuilder
      .range(offset, offset + limit - 1)
      .order('id', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay danh sach he dieu hanh',
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

  async findById(id: number): Promise<HeDieuHanhDto> {
    const row = await this.findOperatingSystemRow(id);
    return this.toDto(row);
  }

  async create(payload: CreateHeDieuHanhDto): Promise<HeDieuHanhDto> {
    const normalizedPayload = this.normalizePayload(payload);

    const { data, error } = await this.client
      .from('he_dieu_hanh')
      .insert(this.toInsert(normalizedPayload))
      .select('*')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Khong the them he dieu hanh');
    }

    return this.toDto(data);
  }

  async update(
    id: number,
    payload: UpdateHeDieuHanhDto,
  ): Promise<HeDieuHanhDto> {
    await this.findOperatingSystemRow(id);
    const normalizedPayload = this.normalizePayload(payload);

    const { data, error } = await this.client
      .from('he_dieu_hanh')
      .update(this.toUpdate(normalizedPayload))
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Khong the cap nhat he dieu hanh');
    }

    return this.toDto(data);
  }

  async remove(id: number): Promise<DeleteHeDieuHanhResponseDto> {
    await this.findOperatingSystemRow(id);
    await this.ensureOperatingSystemNotLinked(id);

    const { error } = await this.client
      .from('he_dieu_hanh')
      .delete()
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException('Khong the xoa he dieu hanh');
    }

    return {
      message: 'Xoa he dieu hanh thanh cong',
    };
  }

  private async findOperatingSystemRow(id: number): Promise<HeDieuHanhRow> {
    const { data, error } = await this.client
      .from('he_dieu_hanh')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay chi tiet he dieu hanh',
      );
    }

    if (!data) {
      throw new NotFoundException('Khong tim thay he dieu hanh');
    }

    return data;
  }

  private async ensureOperatingSystemNotLinked(id: number): Promise<void> {
    const result = (await this.client
      .from('cau_hinh_may_tinh')
      .select('id', { count: 'exact', head: true })
      .eq('he_dieu_hanh_id', id)) as CountResult;

    if (result.error) {
      throw new InternalServerErrorException(
        'Khong the kiem tra lien ket he dieu hanh',
      );
    }

    if ((result.count ?? 0) > 0) {
      throw new ConflictException(
        'Khong the xoa he dieu hanh dang co thiet bi lien ket',
      );
    }
  }

  private normalizePayload(
    payload: CreateHeDieuHanhDto | UpdateHeDieuHanhDto,
  ): CreateHeDieuHanhDto {
    const tenHeDieuHanh = this.requireNonEmpty(
      payload.tenHeDieuHanh,
      'Ten he dieu hanh',
    );
    const phienBan = this.normalizeOptionalText(payload.phienBan);

    return {
      tenHeDieuHanh,
      phienBan,
    };
  }

  private toDto(row: HeDieuHanhRow): HeDieuHanhDto {
    return {
      id: row.id,
      tenHeDieuHanh: row.ten_he_dieu_hanh,
      phienBan: row.phien_ban,
    };
  }

  private toInsert(payload: CreateHeDieuHanhDto): HeDieuHanhInsert {
    return {
      ten_he_dieu_hanh: payload.tenHeDieuHanh,
      phien_ban: payload.phienBan ?? null,
    };
  }

  private toUpdate(payload: UpdateHeDieuHanhDto): HeDieuHanhUpdate {
    return {
      ten_he_dieu_hanh: payload.tenHeDieuHanh,
      phien_ban: payload.phienBan ?? null,
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

  private normalizeOptionalText(value?: string | null): string | null {
    if (value == null) {
      return null;
    }

    const normalizedValue = value.trim();
    return normalizedValue ? normalizedValue : null;
  }
}
