import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/app.config';
import {
  AUTH_STORAGE_FILE,
  DEFAULT_AUTH_SEED_ACCOUNT,
  DEFAULT_AUTH_SEED_PASSWORD_HASH,
} from './../src/auth/auth.constants';
import type { PublicAccount } from './../src/auth/auth.types';

interface LoginResponseBody {
  accessToken: string;
  account: PublicAccount;
}

describe('AuthModule (e2e)', () => {
  let app: INestApplication<App>;

  async function resetAccountsStore(): Promise<void> {
    await mkdir(dirname(AUTH_STORAGE_FILE), { recursive: true });
    await writeFile(
      AUTH_STORAGE_FILE,
      JSON.stringify(
        [
          {
            ...DEFAULT_AUTH_SEED_ACCOUNT,
            passwordHash: DEFAULT_AUTH_SEED_PASSWORD_HASH,
          },
        ],
        null,
        2,
      ),
      'utf8',
    );
  }

  beforeEach(async () => {
    await resetAccountsStore();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('POST /v1/auth/login returns token and account', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: DEFAULT_AUTH_SEED_ACCOUNT.email,
        password: 'admin123',
      })
      .expect(200);

    const body = response.body as LoginResponseBody;

    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.account).toMatchObject({
      id: DEFAULT_AUTH_SEED_ACCOUNT.id,
      email: DEFAULT_AUTH_SEED_ACCOUNT.email,
      name: DEFAULT_AUTH_SEED_ACCOUNT.name,
    });
    expect(body.account).not.toHaveProperty('passwordHash');
  });

  it('GET /v1/auth/me rejects requests without a bearer token', () => {
    return request(app.getHttpServer()).get('/v1/auth/me').expect(401);
  });

  it('GET /v1/auth/me returns the authenticated account', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: DEFAULT_AUTH_SEED_ACCOUNT.email,
        password: 'admin123',
      })
      .expect(200);
    const loginBody = loginResponse.body as LoginResponseBody;

    const response = await request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(200);

    expect((response.body as { account: PublicAccount }).account).toMatchObject(
      {
        id: DEFAULT_AUTH_SEED_ACCOUNT.id,
        email: DEFAULT_AUTH_SEED_ACCOUNT.email,
        name: DEFAULT_AUTH_SEED_ACCOUNT.name,
      },
    );
  });

  it('PATCH /v1/auth/change-password updates the stored password hash', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: DEFAULT_AUTH_SEED_ACCOUNT.email,
        password: 'admin123',
      })
      .expect(200);
    const loginBody = loginResponse.body as LoginResponseBody;

    await request(app.getHttpServer())
      .patch('/v1/auth/change-password')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .send({
        currentPassword: 'admin123',
        newPassword: 'new-secret-123',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: DEFAULT_AUTH_SEED_ACCOUNT.email,
        password: 'admin123',
      })
      .expect(401);

    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: DEFAULT_AUTH_SEED_ACCOUNT.email,
        password: 'new-secret-123',
      })
      .expect(200);
  });

  it('GET /v1 requires authentication when no route exists', () => {
    return request(app.getHttpServer()).get('/v1').expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
