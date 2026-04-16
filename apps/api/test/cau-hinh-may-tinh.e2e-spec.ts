import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import type {
  CauHinhMayTinhDto,
  LoginResponseDto,
  UpsertCauHinhMayTinhDto,
} from '@repo/shared';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import {
  API_DOCS_PATH,
  API_PREFIX,
  OPENAPI_JSON_PATH,
  setupApp,
} from './../src/app.setup';
import { USER_REPOSITORY } from './../src/auth/auth.constants';
import type {
  UserRecord,
  UsersRepository,
} from './../src/auth/users.repository';
import { CauHinhMayTinhService } from './../src/cau-hinh-may-tinh/cau-hinh-may-tinh.service';
import { SupabaseService } from './../src/database';

class InMemoryUsersRepository implements UsersRepository {
  constructor(private readonly users: UserRecord[]) {}

  findById(id: number): Promise<UserRecord | null> {
    return Promise.resolve(this.users.find((user) => user.id === id) ?? null);
  }

  findByUsername(username: string): Promise<UserRecord | null> {
    return Promise.resolve(
      this.users.find((user) => user.username === username) ?? null,
    );
  }

  updatePassword(userId: number, passwordHash: string): Promise<void> {
    const user = this.users.find((currentUser) => currentUser.id === userId);

    if (!user) {
      return Promise.resolve();
    }

    user.passwordHash = passwordHash;
    return Promise.resolve();
  }
}

class InMemoryCauHinhMayTinhService {
  private readonly deviceIds = new Set<number>([1, 2, 3]);

  constructor(private readonly configs: CauHinhMayTinhDto[]) {}

  getByDeviceId(thietBiId: number): Promise<CauHinhMayTinhDto> {
    if (!this.deviceIds.has(thietBiId)) {
      throw new NotFoundException('Khong tim thay thiet bi');
    }

    const config = this.configs.find((item) => item.thietBiId === thietBiId);

    if (!config) {
      throw new NotFoundException('Thiet bi chua co cau hinh may tinh');
    }

    return Promise.resolve(config);
  }

  upsertByDeviceId(
    thietBiId: number,
    payload: UpsertCauHinhMayTinhDto,
  ): Promise<CauHinhMayTinhDto> {
    if (!this.deviceIds.has(thietBiId)) {
      throw new NotFoundException('Khong tim thay thiet bi');
    }

    const existing = this.configs.find((item) => item.thietBiId === thietBiId);

    if (existing) {
      existing.mainboard = payload.mainboard?.trim() || null;
      existing.cpu = payload.cpu?.trim() || null;
      existing.ram = payload.ram?.trim() || null;
      existing.oCung = payload.oCung?.trim() || null;
      existing.heDieuHanhId = payload.heDieuHanhId ?? null;
      existing.manHinh = payload.manHinh?.trim() || null;
      existing.phanMemDietVirusId = payload.phanMemDietVirusId ?? null;
      existing.ghiChu = payload.ghiChu?.trim() || null;

      return Promise.resolve(existing);
    }

    const nextConfig: CauHinhMayTinhDto = {
      id: Math.max(...this.configs.map((item) => item.id)) + 1,
      thietBiId,
      mainboard: payload.mainboard?.trim() || null,
      cpu: payload.cpu?.trim() || null,
      ram: payload.ram?.trim() || null,
      oCung: payload.oCung?.trim() || null,
      heDieuHanhId: payload.heDieuHanhId ?? null,
      manHinh: payload.manHinh?.trim() || null,
      phanMemDietVirusId: payload.phanMemDietVirusId ?? null,
      ghiChu: payload.ghiChu?.trim() || null,
    };

    this.configs.push(nextConfig);
    return Promise.resolve(nextConfig);
  }
}

describe('CauHinhMayTinhController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.BCRYPT_SALT_ROUNDS = '4';

    const usersRepository = new InMemoryUsersRepository([
      {
        id: 1,
        name: 'Administrator',
        username: 'admin',
        email: 'admin@example.com',
        role: 'IT',
        departmentId: 2,
        passwordHash: await bcrypt.hash('old-password', 4),
      },
    ]);

    const configService = new InMemoryCauHinhMayTinhService([
      {
        id: 1,
        thietBiId: 1,
        mainboard: 'Dell 0X123',
        cpu: 'Intel Core i7',
        ram: '16GB DDR5',
        oCung: '512GB SSD',
        heDieuHanhId: 1,
        manHinh: '14 inch FHD',
        phanMemDietVirusId: 1,
        ghiChu: 'May van phong',
      },
    ]);

    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    moduleBuilder.overrideProvider(USER_REPOSITORY).useValue(usersRepository);
    moduleBuilder
      .overrideProvider(CauHinhMayTinhService)
      .useValue(configService);
    moduleBuilder.overrideProvider(SupabaseService).useValue({
      ping: jest.fn().mockResolvedValue(true),
      getClient: jest.fn(),
    });

    const moduleFixture: TestingModule = await moduleBuilder.compile();

    app = moduleFixture.createNestApplication();
    await setupApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns computer configuration by device id', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/cau-hinh-may-tinh/thiet-bi/1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<CauHinhMayTinhDto>;

        expect(body.data).toEqual({
          id: 1,
          thietBiId: 1,
          mainboard: 'Dell 0X123',
          cpu: 'Intel Core i7',
          ram: '16GB DDR5',
          oCung: '512GB SSD',
          heDieuHanhId: 1,
          manHinh: '14 inch FHD',
          phanMemDietVirusId: 1,
          ghiChu: 'May van phong',
        });
      });
  });

  it('creates or updates computer configuration by device id', async () => {
    const accessToken = await login(app);

    const updateResponse = await request(getHttpServer(app))
      .put(`/${API_PREFIX}/cau-hinh-may-tinh/thiet-bi/1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        mainboard: 'Dell 0X456',
        cpu: 'Intel Core Ultra 7',
        ram: '32GB DDR5',
        oCung: '1TB SSD',
        heDieuHanhId: 2,
      })
      .expect(200);

    expect(
      (updateResponse.body as WrappedResponse<CauHinhMayTinhDto>).data.cpu,
    ).toBe('Intel Core Ultra 7');

    const createResponse = await request(getHttpServer(app))
      .put(`/${API_PREFIX}/cau-hinh-may-tinh/thiet-bi/2`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        mainboard: 'HP Board',
        cpu: 'Intel Core i5',
        ram: '8GB DDR4',
        oCung: '256GB SSD',
        heDieuHanhId: 1,
      })
      .expect(200);

    expect(
      (createResponse.body as WrappedResponse<CauHinhMayTinhDto>).data
        .thietBiId,
    ).toBe(2);
  });

  it('shows computer-configuration endpoints in Scalar/OpenAPI', async () => {
    await request(getHttpServer(app))
      .get(OPENAPI_JSON_PATH)
      .expect(200)
      .expect((response) => {
        const openApi = response.body as { paths: Record<string, unknown> };

        expect(
          openApi.paths[
            `/${API_PREFIX}/cau-hinh-may-tinh/thiet-bi/{thietBiId}`
          ],
        ).toBeDefined();
      });

    await request(getHttpServer(app))
      .get(API_DOCS_PATH)
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('Scalar');
      });
  });
});

async function login(app: INestApplication): Promise<string> {
  const response = await request(getHttpServer(app))
    .post(`/${API_PREFIX}/auth/login`)
    .send({
      username: 'admin',
      password: 'old-password',
    })
    .expect(200);

  return (response.body as { data: LoginResponseDto }).data.accessToken;
}

function getHttpServer(app: INestApplication): Parameters<typeof request>[0] {
  return app.getHttpServer() as Parameters<typeof request>[0];
}

interface WrappedResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
