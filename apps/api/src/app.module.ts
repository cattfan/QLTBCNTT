import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BrandsModule } from './brands/brands.module';
import { DeviceTypesModule } from './device-types/device-types.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { DepartmentsModule } from './departments/departments.module';
import { ModelsModule } from './models/models.module';
import { OperatingSystemsModule } from './operating-systems/operating-systems.module';

@Module({
  imports: [
    AuthModule,
    DepartmentsModule,
    DeviceTypesModule,
    BrandsModule,
    ModelsModule,
    OperatingSystemsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
