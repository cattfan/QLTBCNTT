import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { Database } from '@repo/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../database';
import type { UsersRepository, UserRecord } from './users.repository';

type SupabaseUserRow = Pick<
  Database['public']['Tables']['nguoi_dung']['Row'],
  | 'id'
  | 'ho_ten'
  | 'ten_dang_nhap'
  | 'email'
  | 'vai_tro'
  | 'phong_ban_id'
  | 'mat_khau'
>;

@Injectable()
export class SupabaseUsersRepository implements UsersRepository {
  private readonly client: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getClient();
  }

  async findById(id: number): Promise<UserRecord | null> {
    const { data, error } = await this.client
      .from('nguoi_dung')
      .select(
        'id, ho_ten, ten_dang_nhap, email, vai_tro, phong_ban_id, mat_khau',
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Unable to query users table');
    }

    return data ? this.mapRow(data) : null;
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    const { data, error } = await this.client
      .from('nguoi_dung')
      .select(
        'id, ho_ten, ten_dang_nhap, email, vai_tro, phong_ban_id, mat_khau',
      )
      .eq('ten_dang_nhap', username)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Unable to query users table');
    }

    return data ? this.mapRow(data) : null;
  }

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    const { error } = await this.client
      .from('nguoi_dung')
      .update({
        mat_khau: passwordHash,
      })
      .eq('id', userId);

    if (error) {
      throw new InternalServerErrorException('Unable to update user password');
    }
  }

  private mapRow(row: SupabaseUserRow): UserRecord {
    return {
      id: row.id,
      name: row.ho_ten,
      username: row.ten_dang_nhap,
      email: row.email,
      role: row.vai_tro,
      departmentId: row.phong_ban_id,
      passwordHash: row.mat_khau,
    };
  }
}
