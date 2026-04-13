import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  AUTH_STORAGE_FILE,
  DEFAULT_AUTH_SEED_ACCOUNT,
  DEFAULT_AUTH_SEED_PASSWORD_HASH,
} from './auth.constants';
import { AccountRecord, PublicAccount } from './auth.types';

@Injectable()
export class AccountsStore implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.ensureStorageReady();
  }

  async findByEmail(email: string): Promise<AccountRecord | null> {
    const normalizedEmail = this.normalizeEmail(email);
    const accounts = await this.readAccounts();

    return (
      accounts.find(
        (account) => this.normalizeEmail(account.email) === normalizedEmail,
      ) ?? null
    );
  }

  async findById(id: string): Promise<AccountRecord | null> {
    const accounts = await this.readAccounts();

    return accounts.find((account) => account.id === id) ?? null;
  }

  async updatePassword(
    accountId: string,
    passwordHash: string,
  ): Promise<AccountRecord> {
    const accounts = await this.readAccounts();
    const accountIndex = accounts.findIndex(
      (account) => account.id === accountId,
    );

    if (accountIndex === -1) {
      throw new InternalServerErrorException('Account not found');
    }

    const updatedAccount: AccountRecord = {
      ...accounts[accountIndex],
      passwordHash,
      updatedAt: new Date().toISOString(),
    };

    accounts[accountIndex] = updatedAccount;
    await this.persistAccounts(accounts);

    return updatedAccount;
  }

  toPublicAccount(account: AccountRecord): PublicAccount {
    return {
      id: account.id,
      email: account.email,
      name: account.name,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  private async ensureStorageReady(): Promise<void> {
    await mkdir(dirname(AUTH_STORAGE_FILE), { recursive: true });

    try {
      await access(AUTH_STORAGE_FILE);
      const accounts = await this.readAccountsFromDisk();

      if (accounts.length > 0) {
        return;
      }
    } catch (error) {
      if (!this.isMissingFileError(error)) {
        throw error;
      }
    }

    await this.persistAccounts([this.buildSeedAccount()]);
  }

  private async readAccounts(): Promise<AccountRecord[]> {
    await this.ensureStorageReady();
    return this.readAccountsFromDisk();
  }

  private async readAccountsFromDisk(): Promise<AccountRecord[]> {
    const rawContent = await readFile(AUTH_STORAGE_FILE, 'utf8');

    try {
      const parsedContent = JSON.parse(rawContent) as unknown;

      if (!Array.isArray(parsedContent)) {
        throw new InternalServerErrorException(
          'Auth storage format is invalid',
        );
      }

      return parsedContent as AccountRecord[];
    } catch {
      throw new InternalServerErrorException('Auth storage format is invalid');
    }
  }

  private async persistAccounts(accounts: AccountRecord[]): Promise<void> {
    await mkdir(dirname(AUTH_STORAGE_FILE), { recursive: true });
    await writeFile(
      AUTH_STORAGE_FILE,
      JSON.stringify(accounts, null, 2),
      'utf8',
    );
  }

  private buildSeedAccount(): AccountRecord {
    return {
      ...DEFAULT_AUTH_SEED_ACCOUNT,
      email:
        this.normalizeEmail(process.env.AUTH_SEED_EMAIL) ||
        DEFAULT_AUTH_SEED_ACCOUNT.email,
      name:
        process.env.AUTH_SEED_NAME?.trim() || DEFAULT_AUTH_SEED_ACCOUNT.name,
      passwordHash:
        process.env.AUTH_SEED_PASSWORD_HASH?.trim() ||
        DEFAULT_AUTH_SEED_PASSWORD_HASH,
    };
  }

  private normalizeEmail(email: string | undefined): string {
    return email?.trim().toLowerCase() || '';
  }

  private isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    );
  }
}
