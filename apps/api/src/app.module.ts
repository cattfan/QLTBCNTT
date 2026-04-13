import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database';
import { PhongBanModule } from './phong-ban/phong-ban.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env'],
    }),
    DatabaseModule,
    AuthModule,
    PhongBanModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
