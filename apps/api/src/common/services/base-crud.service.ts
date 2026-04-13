/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../database';

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export abstract class BaseCrudService<T = any> {
  protected client: SupabaseClient;

  /** Tên bảng trong Supabase */
  protected abstract tableName: string;

  /** Các cột dùng để tìm kiếm khi nhận query search */
  protected abstract searchColumns: string[];

  constructor(protected readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getClient();
  }

  /**
   * Lấy danh sách có phân trang và tìm kiếm
   */
  async findAll(query: PaginationQuery): Promise<PaginatedResult<T>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    let queryBuilder = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' });

    // Tìm kiếm theo nhiều cột
    if (query.search && this.searchColumns.length > 0) {
      const searchFilter = this.searchColumns
        .map((col) => `${col}.ilike.%${query.search}%`)
        .join(',');
      queryBuilder = queryBuilder.or(searchFilter);
    }

    const { data, count, error } = await queryBuilder
      .range(offset, offset + limit - 1)
      .order('id', { ascending: true });

    if (error) {
      throw new BadRequestException(`Lỗi truy vấn: ${error.message}`);
    }

    const total = count ?? 0;

    return {
      items: (data as T[]) ?? [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Lấy chi tiết theo ID
   */
  async findById(id: string | number): Promise<T> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Không tìm thấy bản ghi với ID: ${id}`);
    }

    return data as T;
  }

  /**
   * Thêm mới bản ghi
   */
  async create(dto: Partial<T>): Promise<T> {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(dto as any)
      .select()
      .single();

    if (error) {
      this.handleSupabaseError(error, 'thêm');
    }

    return data as T;
  }

  /**
   * Cập nhật bản ghi theo ID
   */
  async update(id: string | number, dto: Partial<T>): Promise<T> {
    // Kiểm tra tồn tại trước
    await this.findById(id);

    const { data, error } = await this.client
      .from(this.tableName)
      .update(dto as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleSupabaseError(error, 'cập nhật');
    }

    return data as T;
  }

  /**
   * Xóa bản ghi theo ID
   */
  async remove(id: string | number): Promise<void> {
    // Kiểm tra tồn tại trước
    await this.findById(id);

    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      this.handleSupabaseError(error, 'xóa');
    }
  }

  /**
   * Xử lý lỗi từ Supabase: trùng mã, vi phạm khóa ngoại...
   */
  private handleSupabaseError(error: any, action: string): never {
    const msg = error.message?.toLowerCase() ?? '';
    const code = error.code ?? '';

    // Lỗi trùng giá trị duy nhất (unique constraint)
    if (
      code === '23505' ||
      msg.includes('duplicate') ||
      msg.includes('unique')
    ) {
      throw new ConflictException(
        `Không thể ${action}: dữ liệu bị trùng (mã hoặc tên đã tồn tại)`,
      );
    }

    // Lỗi vi phạm khóa ngoại (foreign key constraint)
    if (
      code === '23503' ||
      msg.includes('foreign key') ||
      msg.includes('violates foreign key')
    ) {
      throw new ConflictException(
        `Không thể ${action}: bản ghi đang được sử dụng ở bảng khác`,
      );
    }

    // Lỗi không xác định
    throw new BadRequestException(`Lỗi khi ${action}: ${error.message}`);
  }
}
