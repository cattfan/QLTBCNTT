import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database';
import { LoaiThietBiModule } from './loai-thiet-bi/loai-thiet-bi.module';
import { PhongBanModule } from './phong-ban/phong-ban.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env'],
    }),
    DatabaseModule,
    AuthModule,
    LoaiThietBiModule,
    PhongBanModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
