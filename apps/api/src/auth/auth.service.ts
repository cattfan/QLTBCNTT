import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  ChangePasswordDto,
  ChangePasswordResponseDto,
  LoginDto,
  LoginResponseDto,
  MeResponseDto,
} from '@repo/shared';
import * as bcrypt from 'bcrypt';
import { USER_REPOSITORY } from './auth.constants';
import type { AuthenticatedUser, JwtPayload } from './auth.types';
import type { UserRecord, UsersRepository } from './users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(USER_REPOSITORY)
    private readonly usersRepository: UsersRepository,
  ) {}

  async login(payload: LoginDto): Promise<LoginResponseDto> {
    const username = this.requireField(payload.username, 'username');
    const password = this.requireField(payload.password, 'password', false);
    const user = await this.usersRepository.findByUsername(username);

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const accessToken = await this.jwtService.signAsync(
      this.createJwtPayload(user),
    );

    return {
      accessToken,
      user: this.toAuthUser(user),
    };
  }

  async getMe(userId: number): Promise<MeResponseDto> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Account not found');
    }

    return {
      user: this.toAuthUser(user),
    };
  }

  async changePassword(
    userId: number,
    payload: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    const oldPassword = this.requireField(
      payload.oldPassword,
      'oldPassword',
      false,
    );
    const newPassword = this.requireField(
      payload.newPassword,
      'newPassword',
      false,
    );

    if (oldPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from old password',
      );
    }

    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Account not found');
    }

    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      user.passwordHash,
    );

    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    const nextPasswordHash = await bcrypt.hash(
      newPassword,
      this.getSaltRounds(),
    );
    await this.usersRepository.updatePassword(user.id, nextPasswordHash);

    return {
      message: 'Password changed successfully',
    };
  }

  private createJwtPayload(user: UserRecord): JwtPayload {
    return {
      sub: user.id,
      username: user.username,
    };
  }

  private toAuthUser(user: UserRecord): AuthenticatedUser {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    };
  }

  private requireField(
    value: string | undefined,
    fieldName: string,
    trimValue = true,
  ): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be a string`);
    }

    const normalizedValue = trimValue ? value.trim() : value;

    if (!normalizedValue) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    return normalizedValue;
  }

  private getSaltRounds(): number {
    const configuredSaltRounds = Number.parseInt(
      process.env.BCRYPT_SALT_ROUNDS ?? '10',
      10,
    );

    if (Number.isNaN(configuredSaltRounds) || configuredSaltRounds < 4) {
      return 10;
    }

    return configuredSaltRounds;
  }
}
