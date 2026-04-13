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
import { MODELS_STORAGE_FILE } from './../src/models/models.constants';

interface LoginResponseBody {
  accessToken: string;
}

interface ListModelsResponseBody {
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

interface ModelResponseBody {
  model: {
    id: string;
    code: string;
    name: string;
    description: string;
    deviceCount?: number;
  };
}

describe('ModelsModule (e2e)', () => {
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

  async function resetModelsStore(): Promise<void> {
    await mkdir(dirname(MODELS_STORAGE_FILE), { recursive: true });
    await writeFile(
      MODELS_STORAGE_FILE,
      JSON.stringify(
        {
          models: [
            {
              id: 'model-latitude',
              code: 'LAT5440',
              name: 'Latitude 5440',
              description: 'Dell Latitude 5440',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 'model-laserjet',
              code: 'LJ400',
              name: 'LaserJet 400',
              description: 'HP LaserJet',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 'model-prodesk',
              code: 'PD600',
              name: 'ProDesk 600',
              description: 'HP ProDesk',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          devices: [
            {
              id: 'device-1',
              modelId: 'model-latitude',
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
    await resetModelsStore();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('GET /v1/models returns paginated models and supports search by name', async () => {
    const accessToken = await loginAndGetAccessToken();

    const response = await request(app.getHttpServer())
      .get('/v1/models?page=1&pageSize=2&search=desk')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as ListModelsResponseBody;

    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({
      id: 'model-prodesk',
      code: 'PD600',
      name: 'ProDesk 600',
    });
    expect(body.pagination).toMatchObject({
      page: 1,
      pageSize: 2,
      totalItems: 1,
      totalPages: 1,
    });
  });

  it('POST /v1/models creates a model and rejects duplicate code', async () => {
    const accessToken = await loginAndGetAccessToken();

    const response = await request(app.getHttpServer())
      .post('/v1/models')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'MBP14',
        name: 'MacBook Pro 14',
        description: 'Apple MacBook Pro 14',
      })
      .expect(201);

    expect((response.body as ModelResponseBody).model).toMatchObject({
      code: 'MBP14',
      name: 'MacBook Pro 14',
      description: 'Apple MacBook Pro 14',
    });

    await request(app.getHttpServer())
      .post('/v1/models')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'mbp14',
        name: 'MacBook Pro 14 M4',
      })
      .expect(409);
  });

  it('GET /v1/models/:id returns model details', async () => {
    const accessToken = await loginAndGetAccessToken();

    const response = await request(app.getHttpServer())
      .get('/v1/models/model-latitude')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect((response.body as ModelResponseBody).model).toMatchObject({
      id: 'model-latitude',
      code: 'LAT5440',
      name: 'Latitude 5440',
      deviceCount: 1,
    });
  });

  it('DELETE /v1/models/:id refuses removal when devices are linked', async () => {
    const accessToken = await loginAndGetAccessToken();

    await request(app.getHttpServer())
      .delete('/v1/models/model-latitude')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409);
  });
});
