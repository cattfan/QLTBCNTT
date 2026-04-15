import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database';
import { HeDieuHanhModule } from './he-dieu-hanh/he-dieu-hanh.module';
import { HangModelModule } from './hang-model/hang-model.module';
import { LoaiThietBiModule } from './loai-thiet-bi/loai-thiet-bi.module';
import { NguonGocTaiSanModule } from './nguon-goc-tai-san/nguon-goc-tai-san.module';
import { NguoiDungModule } from './nguoi-dung/nguoi-dung.module';
import { PhanMemDietVirusModule } from './phan-mem-diet-virus/phan-mem-diet-virus.module';
import { PhongBanModule } from './phong-ban/phong-ban.module';
import { TinhTrangThietBiModule } from './tinh-trang-thiet-bi/tinh-trang-thiet-bi.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env'],
    }),
    DatabaseModule,
    AuthModule,
    HeDieuHanhModule,
    HangModelModule,
    LoaiThietBiModule,
    NguonGocTaiSanModule,
    NguoiDungModule,
    PhanMemDietVirusModule,
    PhongBanModule,
    TinhTrangThietBiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
