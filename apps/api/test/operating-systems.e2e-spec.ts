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
import { OPERATING_SYSTEMS_STORAGE_FILE } from './../src/operating-systems/operating-systems.constants';

interface LoginResponseBody {
  accessToken: string;
}

interface ListOperatingSystemsResponseBody {
  items: Array<{
    id: string;
    code: string;
    name: string;
    deviceCount: number;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

interface OperatingSystemResponseBody {
  operatingSystem: {
    id: string;
    code: string;
    name: string;
    description: string;
    deviceCount?: number;
  };
}

describe('OperatingSystemsModule (e2e)', () => {
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

  async function resetOperatingSystemsStore(): Promise<void> {
    await mkdir(dirname(OPERATING_SYSTEMS_STORAGE_FILE), { recursive: true });
    await writeFile(
      OPERATING_SYSTEMS_STORAGE_FILE,
      JSON.stringify(
        {
          operatingSystems: [
            {
              id: 'os-win10',
              code: 'WIN10',
              name: 'Windows 10',
              description: 'Microsoft Windows 10',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 'os-win11',
              code: 'WIN11',
              name: 'Windows 11',
              description: 'Microsoft Windows 11',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 'os-ubuntu',
              code: 'UBU2204',
              name: 'Ubuntu 22.04',
              description: 'Ubuntu LTS',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          devices: [
            {
              id: 'device-1',
              operatingSystemId: 'os-win10',
              name: 'Laptop Dell 01',
            },
          ],
        },
        null,
        2,
      ),
      'utf8',
    );
  }

  async function loginAndGetAccessToken(): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: DEFAULT_AUTH_SEED_ACCOUNT.email,
        password: 'admin123',
      })
      .expect(200);

    return (response.body as LoginResponseBody).accessToken;
  }

  beforeEach(async () => {
    await resetAccountsStore();
    await resetOperatingSystemsStore();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('GET /v1/operating-systems returns paginated items and supports search by name', async () => {
    const accessToken = await loginAndGetAccessToken();

    const response = await request(app.getHttpServer())
      .get('/v1/operating-systems?page=1&pageSize=2&search=windows')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as ListOperatingSystemsResponseBody;

    expect(body.items).toHaveLength(2);
    expect(body.items[0]).toMatchObject({
      id: 'os-win10',
      code: 'WIN10',
      name: 'Windows 10',
    });
    expect(body.pagination).toMatchObject({
      page: 1,
      pageSize: 2,
      totalItems: 2,
      totalPages: 1,
    });
  });

  it('POST /v1/operating-systems creates an operating system and rejects duplicate code', async () => {
    const accessToken = await loginAndGetAccessToken();

    const response = await request(app.getHttpServer())
      .post('/v1/operating-systems')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'MAC14',
        name: 'macOS Sonoma',
        description: 'Apple macOS Sonoma',
      })
      .expect(201);

    expect(
      (response.body as OperatingSystemResponseBody).operatingSystem,
    ).toMatchObject({
      code: 'MAC14',
      name: 'macOS Sonoma',
      description: 'Apple macOS Sonoma',
    });

    await request(app.getHttpServer())
      .post('/v1/operating-systems')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'mac14',
        name: 'macOS Sequoia',
      })
      .expect(409);
  });

  it('GET /v1/operating-systems/:id returns operating system details', async () => {
    const accessToken = await loginAndGetAccessToken();

    const response = await request(app.getHttpServer())
      .get('/v1/operating-systems/os-win10')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(
      (response.body as OperatingSystemResponseBody).operatingSystem,
    ).toMatchObject({
      id: 'os-win10',
      code: 'WIN10',
      name: 'Windows 10',
      deviceCount: 1,
    });
  });

  it('PATCH /v1/operating-systems/:id updates an operating system', async () => {
    const accessToken = await loginAndGetAccessToken();

    const response = await request(app.getHttpServer())
      .patch('/v1/operating-systems/os-ubuntu')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'UBU2404',
        name: 'Ubuntu 24.04',
      })
      .expect(200);

    expect(
      (response.body as OperatingSystemResponseBody).operatingSystem,
    ).toMatchObject({
      id: 'os-ubuntu',
      code: 'UBU2404',
      name: 'Ubuntu 24.04',
    });
  });

  it('DELETE /v1/operating-systems/:id refuses removal when devices are linked', async () => {
    const accessToken = await loginAndGetAccessToken();

    await request(app.getHttpServer())
      .delete('/v1/operating-systems/os-win10')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409);
  });
});
