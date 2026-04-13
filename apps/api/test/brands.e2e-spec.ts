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
import { BRANDS_STORAGE_FILE } from './../src/brands/brands.constants';

interface LoginResponseBody {
  accessToken: string;
}

interface ListBrandsResponseBody {
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

interface BrandResponseBody {
  brand: {
    id: string;
    code: string;
    name: string;
    description: string;
    deviceCount?: number;
  };
}

describe('BrandsModule (e2e)', () => {
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

  async function resetBrandsStore(): Promise<void> {
    await mkdir(dirname(BRANDS_STORAGE_FILE), { recursive: true });
    await writeFile(
      BRANDS_STORAGE_FILE,
      JSON.stringify(
        {
          brands: [
            {
              id: 'brand-dell',
              code: 'DELL',
              name: 'Dell',
              description: 'Hang Dell',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 'brand-canon',
              code: 'CANON',
              name: 'Canon',
              description: 'Hang Canon',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 'brand-hp',
              code: 'HP',
              name: 'HP',
              description: 'Hang HP',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          devices: [
            {
              id: 'device-1',
              brandId: 'brand-dell',
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
    await resetBrandsStore();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('GET /v1/brands returns paginated brands and supports search by name', async () => {
    const accessToken = await loginAndGetAccessToken();

    const response = await request(app.getHttpServer())
      .get('/v1/brands?page=1&pageSize=2&search=a')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as ListBrandsResponseBody;

    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({
      id: 'brand-canon',
      code: 'CANON',
      name: 'Canon',
    });
    expect(body.pagination).toMatchObject({
      page: 1,
      pageSize: 2,
      totalItems: 1,
      totalPages: 1,
    });
  });

  it('POST /v1/brands creates a brand and rejects duplicate code', async () => {
    const accessToken = await loginAndGetAccessToken();

    const response = await request(app.getHttpServer())
      .post('/v1/brands')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'ASUS',
        name: 'Asus',
        description: 'Hang Asus',
      })
      .expect(201);

    expect((response.body as BrandResponseBody).brand).toMatchObject({
      code: 'ASUS',
      name: 'Asus',
      description: 'Hang Asus',
    });

    await request(app.getHttpServer())
      .post('/v1/brands')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'asus',
        name: 'Asus 2',
      })
      .expect(409);
  });

  it('GET /v1/brands/:id returns brand details', async () => {
    const accessToken = await loginAndGetAccessToken();

    const response = await request(app.getHttpServer())
      .get('/v1/brands/brand-dell')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect((response.body as BrandResponseBody).brand).toMatchObject({
      id: 'brand-dell',
      code: 'DELL',
      name: 'Dell',
      deviceCount: 1,
    });
  });

  it('DELETE /v1/brands/:id refuses removal when devices are linked', async () => {
    const accessToken = await loginAndGetAccessToken();

    await request(app.getHttpServer())
      .delete('/v1/brands/brand-dell')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409);
  });
});
