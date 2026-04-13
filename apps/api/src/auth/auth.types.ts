export interface AccountRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export type PublicAccount = Omit<AccountRecord, 'passwordHash'>;

export type AuthenticatedUser = PublicAccount;

export interface JwtPayload {
  sub: string;
  email: string;
}
