import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BanGiaoModule } from './ban-giao/ban-giao.module';
import { CauHinhMayTinhModule } from './cau-hinh-may-tinh/cau-hinh-may-tinh.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseModule } from './database';
import { HeDieuHanhModule } from './he-dieu-hanh/he-dieu-hanh.module';
import { HangModelModule } from './hang-model/hang-model.module';
import { LichSuBanGiaoModule } from './lich-su-ban-giao/lich-su-ban-giao.module';
import { LoaiThietBiModule } from './loai-thiet-bi/loai-thiet-bi.module';
import { NguonGocTaiSanModule } from './nguon-goc-tai-san/nguon-goc-tai-san.module';
import { NguoiDungModule } from './nguoi-dung/nguoi-dung.module';
import { PhanMemDietVirusModule } from './phan-mem-diet-virus/phan-mem-diet-virus.module';
import { PhongBanModule } from './phong-ban/phong-ban.module';
import { SuaChuaBaoTriModule } from './sua-chua-bao-tri/sua-chua-bao-tri.module';
import { ThietBiModule } from './thiet-bi/thiet-bi.module';
import { ThongKeChiPhiModule } from './thong-ke-chi-phi/thong-ke-chi-phi.module';
import { TinhTrangThietBiModule } from './tinh-trang-thiet-bi/tinh-trang-thiet-bi.module';
import { ThuHoiModule } from './thu-hoi/thu-hoi.module';
import { XuatBaoCaoModule } from './xuat-bao-cao/xuat-bao-cao.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env'],
    }),
    BanGiaoModule,
    CauHinhMayTinhModule,
    DashboardModule,
    DatabaseModule,
    AuthModule,
    HeDieuHanhModule,
    HangModelModule,
    LichSuBanGiaoModule,
    LoaiThietBiModule,
    NguonGocTaiSanModule,
    NguoiDungModule,
    PhanMemDietVirusModule,
    PhongBanModule,
    SuaChuaBaoTriModule,
    ThietBiModule,
    ThongKeChiPhiModule,
    TinhTrangThietBiModule,
    ThuHoiModule,
    XuatBaoCaoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
