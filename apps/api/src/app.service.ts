import { Injectable, OnModuleInit } from '@nestjs/common';
import { SupabaseService } from './database';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly supabaseService: SupabaseService) {}

  async onModuleInit() {
    await this.supabaseService.ping();
  }

  getStatus() {
    return {
      message: 'API QLTBCNTT đang hoạt động',
      timestamp: new Date().toISOString(),
    };
  }
}
