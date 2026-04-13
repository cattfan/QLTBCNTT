import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { AccountsStore } from './accounts.store';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly accountsStore: AccountsStore,
    private readonly jwtService: JwtService,
  ) {}

  async login(payload: LoginDto) {
    const email = this.requireText(payload.email, 'email').toLowerCase();
    const password = this.requireText(payload.password, 'password');
    const account = await this.accountsStore.findByEmail(email);

    if (!account) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await compare(password, account.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const publicAccount = this.accountsStore.toPublicAccount(account);
    const accessToken = await this.jwtService.signAsync({
      sub: account.id,
      email: account.email,
    });

    return {
      accessToken,
      account: publicAccount,
    };
  }

  getCurrentUser(user: AuthenticatedUser) {
    return {
      account: user,
    };
  }

  async changePassword(userId: string, payload: ChangePasswordDto) {
    const currentPassword = this.requireText(
      payload.currentPassword,
      'currentPassword',
    );
    const newPassword = this.requireText(payload.newPassword, 'newPassword');

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const account = await this.accountsStore.findById(userId);

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    const passwordMatches = await compare(
      currentPassword,
      account.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await hash(newPassword, 10);
    const updatedAccount = await this.accountsStore.updatePassword(
      account.id,
      passwordHash,
    );

    return {
      message: 'Password changed successfully',
      account: this.accountsStore.toPublicAccount(updatedAccount),
    };
  }

  async validateAuthenticatedUser(userId: string): Promise<AuthenticatedUser> {
    const account = await this.accountsStore.findById(userId);

    if (!account) {
      throw new UnauthorizedException('Invalid token');
    }

    return this.accountsStore.toPublicAccount(account);
  }

  private requireText(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    return value.trim();
  }
}
