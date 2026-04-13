import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Database } from '@repo/shared';
import type { UsersRepository, UserRecord } from './users.repository';

type SupabaseUserRow = Database['public']['Tables']['users']['Row'];

@Injectable()
export class SupabaseUsersRepository implements UsersRepository {
  async findById(id: string): Promise<UserRecord | null> {
    const [user] = await this.selectUsers({
      id: `eq.${id}`,
      limit: '1',
    });

    return user ?? null;
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    const [user] = await this.selectUsers({
      username: `eq.${username}`,
      limit: '1',
    });

    return user ?? null;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const response = await fetch(this.createUsersUrl({ id: `eq.${userId}` }), {
      method: 'PATCH',
      headers: this.createHeaders({
        Prefer: 'return=minimal',
      }),
      body: JSON.stringify({
        password_hash: passwordHash,
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException('Unable to update user password');
    }
  }

  private async selectUsers(
    filters: Record<string, string>,
  ): Promise<UserRecord[]> {
    const response = await fetch(
      this.createUsersUrl({
        select: 'id,created_at,name,username,password_hash',
        ...filters,
      }),
      {
        method: 'GET',
        headers: this.createHeaders(),
      },
    );

    if (!response.ok) {
      throw new InternalServerErrorException('Unable to query users table');
    }

    const rows = (await response.json()) as SupabaseUserRow[];
    return rows.map((row) => this.mapRow(row));
  }

  private mapRow(row: SupabaseUserRow): UserRecord {
    return {
      id: row.id,
      createdAt: row.created_at,
      name: row.name,
      username: row.username,
      passwordHash: row.password_hash,
    };
  }

  private createUsersUrl(params: Record<string, string>): string {
    const url = new URL(`${this.getSupabaseUrl()}/rest/v1/users`);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    return url.toString();
  }

  private createHeaders(extraHeaders: HeadersInit = {}): HeadersInit {
    const serviceRoleKey = this.getServiceRoleKey();

    return {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    };
  }

  private getSupabaseUrl(): string {
    const supabaseUrl = process.env.SUPABASE_URL?.trim();

    if (!supabaseUrl) {
      throw new ServiceUnavailableException('SUPABASE_URL is not configured');
    }

    return supabaseUrl.replace(/\/+$/, '');
  }

  private getServiceRoleKey(): string {
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_KEY?.trim() ??
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!serviceRoleKey) {
      throw new ServiceUnavailableException(
        'SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY is not configured',
      );
    }

    return serviceRoleKey;
  }
}
