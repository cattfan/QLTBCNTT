import { resolve } from 'node:path';

export const DEFAULT_AUTH_STORAGE_FILE = resolve(
  __dirname,
  '..',
  '..',
  '.data',
  'accounts.json',
);

export const AUTH_STORAGE_FILE =
  process.env.AUTH_STORAGE_FILE?.trim() || DEFAULT_AUTH_STORAGE_FILE;

export const DEFAULT_JWT_SECRET = 'dev-only-jwt-secret-change-me';

export const DEFAULT_AUTH_SEED_ACCOUNT = {
  id: 'local-admin',
  email: 'admin@example.com',
  name: 'Administrator',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as const;

export const DEFAULT_AUTH_SEED_PASSWORD_HASH =
  '$2b$10$mgXl86Hkj7aBoBdktnrgNuS5YGeHZCwDOrMq.prx4lIRbvqQVNzce';

export function getJwtSecret(): string {
  return process.env.JWT_SECRET?.trim() || DEFAULT_JWT_SECRET;
}
