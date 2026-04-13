import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
import { DEPARTMENTS_STORAGE_FILE } from './../src/departments/departments.constants';
import type { DepartmentRecord } from './../src/departments/departments.types';

interface LoginResponseBody {
  accessToken: string;
}

interface ListDepartmentsResponseBody {
  items: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

interface DepartmentDetailsResponseBody {
  department: {
    id: string;
    code: string;
    name: string;
    employeeCount: number;
    deviceCount: number;
  };
}

interface DepartmentMutationResponseBody {
  department: {
    id: string;
    code: string;
    name: string;
    description: string;
  };
}

describe('DepartmentsModule (e2e)', () => {
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

  async function resetDepartmentsStore(): Promise<void> {
    await mkdir(dirname(DEPARTMENTS_STORAGE_FILE), { recursive: true });
    await writeFile(
      DEPARTMENTS_STORAGE_FILE,
      JSON.stringify(
        {
          departments: [
            {
              id: 'dept-it',
              code: 'IT',
              name: 'Cong nghe thong tin',
              description: 'Phong CNTT',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 'dept-hr',
              code: 'HCNS',
              name: 'Hanh chinh nhan su',
              description: 'Phong HCNS',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 'dept-ops',
              code: 'OPS',
              name: 'Van hanh',
              description: '',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          employees: [
            {
              id: 'emp-1',
              departmentId: 'dept-it',
              name: 'Nguyen Van A',
            },
          ],
          devices: [
            {
              id: 'device-1',
              departmentId: 'dept-it',
              name: 'Laptop 01',
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
    await resetDepartmentsStore();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('GET /v1/departments returns paginated departments and supports search', async () => {
    const accessToken = await loginAndGetAccessToken();

    const response = await request(app.getHttpServer())
      .get('/v1/departments?page=1&pageSize=2&search=hanh')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as ListDepartmentsResponseBody;

    expect(body.items).toHaveLength(2);
    expect(body.items[0]).toMatchObject({
      id: 'dept-hr',
      code: 'HCNS',
      name: 'Hanh chinh nhan su',
    });
    expect(body.pagination).toMatchObject({
      page: 1,
      pageSize: 2,
      totalItems: 2,
      totalPages: 1,
    });
  });

  it('POST /v1/departments creates a department and rejects duplicate code', async () => {
    const accessToken = await loginAndGetAccessToken();

    const createResponse = await request(app.getHttpServer())
      .post('/v1/departments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'KT',
        name: 'Ke toan',
        description: 'Phong ke toan',
      })
      .expect(201);

    const body = createResponse.body as DepartmentMutationResponseBody;

    expect(body.department).toMatchObject({
      code: 'KT',
      name: 'Ke toan',
      description: 'Phong ke toan',
    });

    await request(app.getHttpServer())
      .post('/v1/departments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'kt',
        name: 'Ke toan 2',
      })
      .expect(409);
  });

  it('POST /v1/departments rejects blank code', async () => {
    const accessToken = await loginAndGetAccessToken();

    await request(app.getHttpServer())
      .post('/v1/departments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: '   ',
        name: 'Phong moi',
      })
      .expect(400);
  });

  it('GET /v1/departments/:id returns department details', async () => {
    const accessToken = await loginAndGetAccessToken();

    const response = await request(app.getHttpServer())
      .get('/v1/departments/dept-it')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as DepartmentDetailsResponseBody;

    expect(body.department).toMatchObject({
      id: 'dept-it',
      code: 'IT',
      name: 'Cong nghe thong tin',
      employeeCount: 1,
      deviceCount: 1,
    });
  });

  it('PATCH /v1/departments/:id updates department info', async () => {
    const accessToken = await loginAndGetAccessToken();

    const response = await request(app.getHttpServer())
      .patch('/v1/departments/dept-hr')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'HRM',
        name: 'Nhan su',
      })
      .expect(200);

    const body = response.body as DepartmentMutationResponseBody;

    expect(body.department).toMatchObject({
      id: 'dept-hr',
      code: 'HRM',
      name: 'Nhan su',
    });
  });

  it('DELETE /v1/departments/:id refuses removal when employees or devices are linked', async () => {
    const accessToken = await loginAndGetAccessToken();

    await request(app.getHttpServer())
      .delete('/v1/departments/dept-it')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409);
  });

  it('DELETE /v1/departments/:id removes department without linked resources', async () => {
    const accessToken = await loginAndGetAccessToken();

    await request(app.getHttpServer())
      .delete('/v1/departments/dept-ops')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const state = JSON.parse(
      await readFile(DEPARTMENTS_STORAGE_FILE, 'utf8'),
    ) as { departments: DepartmentRecord[] };

    expect(
      state.departments.find((department) => department.id === 'dept-ops'),
    ).toBeUndefined();
  });

  afterEach(async () => {
    await app.close();
  });
});
