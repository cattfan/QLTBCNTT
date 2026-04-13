import type { AuthUserDto } from '@repo/shared';
import type { Request } from 'express';

export interface JwtPayload {
  sub: string;
  username: string;
}

export type AuthenticatedUser = AuthUserDto;

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  tokenPayload?: JwtPayload;
}
