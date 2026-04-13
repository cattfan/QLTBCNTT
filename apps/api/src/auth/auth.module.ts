import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from '../database';
import { USER_REPOSITORY } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SupabaseUsersRepository } from './supabase-users.repository';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET ?? 'dev-only-secret',
        signOptions: {
          expiresIn: (process.env.JWT_EXPIRATION ??
            process.env.JWT_EXPIRES_IN ??
            '1d') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SupabaseUsersRepository,
    {
      provide: USER_REPOSITORY,
      useExisting: SupabaseUsersRepository,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService, USER_REPOSITORY],
})
export class AuthModule {}
