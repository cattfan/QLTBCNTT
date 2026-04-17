import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import type {
  CostByTimeResponseDto,
  DashboardDepartmentDistributionDto,
  DashboardOverviewDto,
  DashboardRecentEventsDto,
  LoginResponseDto,
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
import { SupabaseService } from './../src/database';
import { DashboardService } from './../src/dashboard/dashboard.service';

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

    if (user) {
      user.passwordHash = passwordHash;
    }

    return Promise.resolve();
  }
}

class InMemoryDashboardService {
  getOverview(): Promise<DashboardOverviewDto> {
    return Promise.resolve({
      totalDevices: 120,
      inUseDevices: 60,
      inStockDevices: 40,
      inRepairDevices: 5,
    });
  }

  getDepartmentDistribution(): Promise<DashboardDepartmentDistributionDto> {
    return Promise.resolve({
      items: [
        { departmentId: 2, departmentName: 'Phong CNTT', totalDevices: 30 },
        { departmentId: 3, departmentName: 'Phong Ke toan', totalDevices: 15 },
      ],
    });
  }

  getRecentEvents(): Promise<DashboardRecentEventsDto> {
    return Promise.resolve({
      items: [
        {
          eventType: 'bao_hong',
          occurredAt: '2026-04-17',
          deviceId: 1,
          deviceCode: 'TB-001',
          deviceName: 'Laptop Dell Latitude',
          employeeId: null,
          employeeCode: null,
          employeeName: null,
          note: 'Khong len nguon',
        },
        {
          eventType: 'ban_giao',
          occurredAt: '2026-04-16',
          deviceId: 1,
          deviceCode: 'TB-001',
          deviceName: 'Laptop Dell Latitude',
          employeeId: 2,
          employeeCode: 'nguyenvana',
          employeeName: 'Nguyen Van A',
          note: 'Cap cho nhan vien moi',
        },
      ],
    });
  }

  byTime(): Promise<CostByTimeResponseDto> {
    return Promise.resolve({
      granularity: 'month',
      items: [
        { period: '2026-01', totalCost: 1000000 },
        { period: '2026-02', totalCost: 500000 },
      ],
    });
  }
}

describe('DashboardController (e2e)', () => {
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

    const dashboardService = new InMemoryDashboardService();

    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    moduleBuilder.overrideProvider(USER_REPOSITORY).useValue(usersRepository);
    moduleBuilder.overrideProvider(DashboardService).useValue(dashboardService);
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

  it('returns overview metrics', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/dashboard/overview`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as { data: DashboardOverviewDto };
        expect(body.data.totalDevices).toBe(120);
      });
  });

  it('returns device distribution by department', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/dashboard/device-distribution-by-department`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as {
          data: DashboardDepartmentDistributionDto;
        };
        expect(body.data.items[0]?.departmentName).toBe('Phong CNTT');
      });
  });

  it('returns 10 recent events payload', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/dashboard/recent-events`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as { data: DashboardRecentEventsDto };
        expect(body.data.items[0]?.eventType).toBe('bao_hong');
      });
  });

  it('shows dashboard endpoints in Scalar/OpenAPI', async () => {
    await request(getHttpServer(app))
      .get(OPENAPI_JSON_PATH)
      .expect(200)
      .expect((response) => {
        const openApi = response.body as { paths: Record<string, unknown> };

        expect(
          openApi.paths[`/${API_PREFIX}/dashboard/overview`],
        ).toBeDefined();
        expect(
          openApi.paths[
            `/${API_PREFIX}/dashboard/device-distribution-by-department`
          ],
        ).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/dashboard/recent-events`],
        ).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/dashboard/repair-cost-by-time`],
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
