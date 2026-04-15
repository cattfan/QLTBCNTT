import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.types';

@Injectable()
export class ItOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user?.role === 'IT') {
      return true;
    }

    throw new ForbiddenException('Chi tai khoan IT moi duoc phep thuc hien');
  }
}
