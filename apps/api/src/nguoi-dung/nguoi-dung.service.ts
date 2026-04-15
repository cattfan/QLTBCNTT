import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type {
  ActionMessageResponseDto,
  CreateNguoiDungDto,
  NguoiDungDto,
  NguoiDungListResponseDto,
  NguoiDungQueryDto,
  SetNguoiDungRoleDto,
  Tables,
  UpdateNguoiDungDto,
} from '@repo/shared';
import type { Database } from '@repo/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../database';

type NguoiDungRow = Tables<'nguoi_dung'>;

@Injectable()
export class NguoiDungService {
  private readonly client: SupabaseClient<Database>;

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getClient();
  }

  async findAll(query: NguoiDungQueryDto): Promise<NguoiDungListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    let queryBuilder = this.client
      .from('nguoi_dung')
      .select(
        'id, ho_ten, ten_dang_nhap, email, so_dien_thoai, phong_ban_id, trang_thai, vai_tro',
        { count: 'exact' },
      );

    if (query.role) {
      queryBuilder = queryBuilder.eq('vai_tro', query.role);
    }

    if (query.departmentId !== undefined) {
      queryBuilder = queryBuilder.eq('phong_ban_id', query.departmentId);
    }

    const { data, count, error } = await queryBuilder
      .range(offset, offset + limit - 1)
      .order('id', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay danh sach tai khoan',
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

  async create(payload: CreateNguoiDungDto): Promise<NguoiDungDto> {
    const normalizedPayload = this.normalizeCreatePayload(payload);
    await this.ensureUsernameAvailable(normalizedPayload.username);

    const defaultPasswordHash = await bcrypt.hash(
      this.getDefaultPassword(),
      this.getSaltRounds(),
    );

    const { data, error } = await this.client
      .from('nguoi_dung')
      .insert({
        ho_ten: normalizedPayload.name,
        ten_dang_nhap: normalizedPayload.username,
        email: normalizedPayload.email,
        so_dien_thoai: normalizedPayload.phoneNumber,
        phong_ban_id: normalizedPayload.departmentId,
        vai_tro: normalizedPayload.role,
        trang_thai: true,
        mat_khau: defaultPasswordHash,
      })
      .select(
        'id, ho_ten, ten_dang_nhap, email, so_dien_thoai, phong_ban_id, trang_thai, vai_tro',
      )
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Khong the them tai khoan');
    }

    return this.toDto(data);
  }

  async update(id: number, payload: UpdateNguoiDungDto): Promise<NguoiDungDto> {
    await this.findUserRow(id);
    const normalizedPayload = this.normalizeUpdatePayload(payload);

    const { data, error } = await this.client
      .from('nguoi_dung')
      .update({
        ho_ten: normalizedPayload.name,
        email: normalizedPayload.email,
        so_dien_thoai: normalizedPayload.phoneNumber,
        phong_ban_id: normalizedPayload.departmentId,
      })
      .eq('id', id)
      .select(
        'id, ho_ten, ten_dang_nhap, email, so_dien_thoai, phong_ban_id, trang_thai, vai_tro',
      )
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Khong the cap nhat tai khoan');
    }

    return this.toDto(data);
  }

  async resetPassword(id: number): Promise<ActionMessageResponseDto> {
    await this.findUserRow(id);

    const passwordHash = await bcrypt.hash(
      this.getDefaultPassword(),
      this.getSaltRounds(),
    );

    await this.updateUserFields(id, {
      mat_khau: passwordHash,
    });

    return {
      message: 'Dat lai mat khau mac dinh thanh cong',
    };
  }

  async lock(id: number): Promise<ActionMessageResponseDto> {
    await this.findUserRow(id);
    await this.updateUserFields(id, { trang_thai: false });

    return {
      message: 'Khoa tai khoan thanh cong',
    };
  }

  async unlock(id: number): Promise<ActionMessageResponseDto> {
    await this.findUserRow(id);
    await this.updateUserFields(id, { trang_thai: true });

    return {
      message: 'Mo khoa tai khoan thanh cong',
    };
  }

  async setRole(
    id: number,
    payload: SetNguoiDungRoleDto,
  ): Promise<ActionMessageResponseDto> {
    await this.findUserRow(id);
    await this.updateUserFields(id, { vai_tro: payload.role });

    return {
      message: 'Gan vai tro thanh cong',
    };
  }

  private async findUserRow(id: number): Promise<NguoiDungRow> {
    const { data, error } = await this.client
      .from('nguoi_dung')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay thong tin tai khoan',
      );
    }

    if (!data) {
      throw new NotFoundException('Khong tim thay tai khoan');
    }

    return data;
  }

  private async ensureUsernameAvailable(username: string): Promise<void> {
    const { data, error } = await this.client
      .from('nguoi_dung')
      .select('id')
      .eq('ten_dang_nhap', username)
      .limit(1);

    if (error) {
      throw new InternalServerErrorException(
        'Khong the kiem tra ten dang nhap',
      );
    }

    if ((data ?? []).length > 0) {
      throw new ConflictException('Ten dang nhap da ton tai');
    }
  }

  private async updateUserFields(
    id: number,
    payload: Partial<{
      mat_khau: string;
      trang_thai: boolean;
      vai_tro: 'IT' | 'User';
    }>,
  ): Promise<void> {
    const { error } = await this.client
      .from('nguoi_dung')
      .update(payload)
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException('Khong the cap nhat tai khoan');
    }
  }

  private toDto(
    row: Pick<
      NguoiDungRow,
      | 'id'
      | 'ho_ten'
      | 'ten_dang_nhap'
      | 'email'
      | 'so_dien_thoai'
      | 'phong_ban_id'
      | 'trang_thai'
      | 'vai_tro'
    >,
  ): NguoiDungDto {
    return {
      id: row.id,
      name: row.ho_ten,
      username: row.ten_dang_nhap,
      email: row.email,
      phoneNumber: row.so_dien_thoai,
      departmentId: row.phong_ban_id,
      isActive: row.trang_thai ?? true,
      role: row.vai_tro === 'IT' ? 'IT' : 'User',
    };
  }

  private normalizeCreatePayload(
    payload: CreateNguoiDungDto,
  ): CreateNguoiDungDto {
    return {
      name: this.requireNonEmpty(payload.name, 'Ten nhan vien'),
      username: this.requireNonEmpty(payload.username, 'Ten dang nhap'),
      email: this.normalizeOptionalText(payload.email),
      phoneNumber: this.normalizeOptionalText(payload.phoneNumber),
      departmentId: payload.departmentId ?? null,
      role: payload.role ?? 'User',
    };
  }

  private normalizeUpdatePayload(
    payload: UpdateNguoiDungDto,
  ): UpdateNguoiDungDto {
    return {
      name: this.requireNonEmpty(payload.name, 'Ten nhan vien'),
      email: this.normalizeOptionalText(payload.email),
      phoneNumber: this.normalizeOptionalText(payload.phoneNumber),
      departmentId: payload.departmentId ?? null,
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

  private getDefaultPassword(): string {
    return process.env.DEFAULT_USER_PASSWORD ?? '123456';
  }

  private getSaltRounds(): number {
    const configuredSaltRounds = Number.parseInt(
      process.env.BCRYPT_SALT_ROUNDS ?? '10',
      10,
    );

    if (Number.isNaN(configuredSaltRounds) || configuredSaltRounds < 4) {
      return 10;
    }

    return configuredSaltRounds;
  }
}
