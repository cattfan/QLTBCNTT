import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Database } from '@repo/shared';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient<Database>;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_SERVICE_KEY. Vui lòng kiểm tra file .env',
      );
    }

    this.client = createClient<Database>(supabaseUrl, supabaseKey);
  }

  /** Trả về SupabaseClient để các Service khác truy vấn CSDL */
  getClient(): SupabaseClient<Database> {
    return this.client;
  }

  /** Kiểm tra kết nối bằng cách truy vấn thử bảng phong_ban */
  async ping(): Promise<boolean> {
    const { error } = await this.client.from('phong_ban').select('id').limit(1);

    if (error) {
      console.error('Kết nối Supabase thất bại:', error.message);
      return false;
    }

    console.log('Kết nối Supabase thành công!');
    return true;
  }
}
