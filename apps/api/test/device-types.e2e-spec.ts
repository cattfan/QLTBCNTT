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
import { DEVICE_TYPES_STORAGE_FILE } from './../src/device-types/device-types.constants';

interface LoginResponseBody {
  accessToken: string;
}

interface ListDeviceTypesResponseBody {
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

interface DeviceTypeDetailsResponseBody {
  deviceType: {
    id: string;
    code: string;
    name: string;
    deviceCount: number;
  };
}

interface DeviceTypeMutationResponseBody {
  deviceType: {
    id: string;
    code: string;
    name: string;
    description: string;
  };
}

interface ErrorResponseBody {
  message: string;
}

describe('DeviceTypesModule (e2e)', () => {
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

  async function resetDeviceTypesStore(): Promise<void> {
    await mkdir(dirname(DEVICE_TYPES_STORAGE_FILE), { recursive: true });
    await writeFile(
      DEVICE_TYPES_STORAGE_FILE,
      JSON.stringify(
        {
          deviceTypes: [
            {
              id: 'type-laptop',
              code: 'LAP',
              name: 'Laptop',
              description: 'May tinh xach tay',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 'type-desktop',
              code: 'DESK',
              name: 'May ban',
              description: 'May tinh de ban',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 'type-printer',
              code: 'PRINT',
              name: 'May in',
              description: 'Thiet bi in',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          devices: [
            {
              id: 'device-1',
              typeId: 'type-laptop',
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
    await resetDeviceTypesStore();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('GET /v1/device-types returns paginated device types and supports search by name', async () => {
    const accessToken = await loginAndGetAccessToken();

    const response = await request(app.getHttpServer())
      .get('/v1/device-types?page=1&pageSize=2&search=may')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as ListDeviceTypesResponseBody;

    expect(body.items).toHaveLength(2);
    expect(body.items[0]).toMatchObject({
      id: 'type-desktop',
      code: 'DESK',
      name: 'May ban',
    });
    expect(body.pagination).toMatchObject({
      page: 1,
      pageSize: 2,
      totalItems: 2,
      totalPages: 1,
    });
  });

  it('POST /v1/device-types creates a device type and rejects duplicate code', async () => {
    const accessToken = await loginAndGetAccessToken();

    const createResponse = await request(app.getHttpServer())
      .post('/v1/device-types')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'SCAN',
        name: 'May quet',
        description: 'Scanner',
      })
      .expect(201);

    const body = createResponse.body as DeviceTypeMutationResponseBody;

    expect(body.deviceType).toMatchObject({
      code: 'SCAN',
      name: 'May quet',
      description: 'Scanner',
    });

    await request(app.getHttpServer())
      .post('/v1/device-types')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'scan',
        name: 'Scanner 2',
      })
      .expect(409);
  });

  it('GET /v1/device-types/:id returns device type details', async () => {
    const accessToken = await loginAndGetAccessToken();

    const response = await request(app.getHttpServer())
      .get('/v1/device-types/type-laptop')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as DeviceTypeDetailsResponseBody;

    expect(body.deviceType).toMatchObject({
      id: 'type-laptop',
      code: 'LAP',
      name: 'Laptop',
      deviceCount: 1,
    });
  });

  it('PATCH /v1/device-types/:id updates a device type', async () => {
    const accessToken = await loginAndGetAccessToken();

    const response = await request(app.getHttpServer())
      .patch('/v1/device-types/type-desktop')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'DESKTOP',
        name: 'May tinh ban',
      })
      .expect(200);

    const body = response.body as DeviceTypeMutationResponseBody;

    expect(body.deviceType).toMatchObject({
      id: 'type-desktop',
      code: 'DESKTOP',
      name: 'May tinh ban',
    });
  });

  it('DELETE /v1/device-types/:id refuses removal when devices are linked', async () => {
    const accessToken = await loginAndGetAccessToken();

    await request(app.getHttpServer())
      .delete('/v1/device-types/type-laptop')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409);
  });

  it('DELETE /v1/device-types/:id removes an unused device type', async () => {
    const accessToken = await loginAndGetAccessToken();

    await request(app.getHttpServer())
      .delete('/v1/device-types/type-printer')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/v1/device-types/type-printer')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    expect((response.body as ErrorResponseBody).message).toBe(
      'Device type not found',
    );
  });
});
