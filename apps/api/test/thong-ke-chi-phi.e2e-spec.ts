import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import type {
  CostByTimeResponseDto,
  CostStatsResponseDto,
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
import { ThongKeChiPhiService } from './../src/thong-ke-chi-phi/thong-ke-chi-phi.service';

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

class InMemoryThongKeChiPhiService {
  byDeviceType(): Promise<CostStatsResponseDto> {
    return Promise.resolve({
      items: [
        { key: '1', label: 'Laptop', totalCost: 1500000 },
        { key: '2', label: 'May in', totalCost: 500000 },
      ],
    });
  }

  byDepartment(): Promise<CostStatsResponseDto> {
    return Promise.resolve({
      items: [
        { key: '2', label: 'Phong CNTT', totalCost: 1800000 },
        { key: '3', label: 'Phong Ke toan', totalCost: 200000 },
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

describe('ThongKeChiPhiController (e2e)', () => {
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

    const statsService = new InMemoryThongKeChiPhiService();

    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    moduleBuilder.overrideProvider(USER_REPOSITORY).useValue(usersRepository);
    moduleBuilder.overrideProvider(ThongKeChiPhiService).useValue(statsService);
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

  it('returns total repair cost by device type', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/thong-ke-chi-phi/theo-loai-thiet-bi`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as { data: CostStatsResponseDto };
        expect(body.data.items[0]?.label).toBe('Laptop');
      });
  });

  it('returns total repair cost by department', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/thong-ke-chi-phi/theo-phong-ban`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as { data: CostStatsResponseDto };
        expect(body.data.items[0]?.key).toBe('2');
      });
  });

  it('returns total repair cost by time range', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/thong-ke-chi-phi/theo-thoi-gian?granularity=month`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as { data: CostByTimeResponseDto };
        expect(body.data.granularity).toBe('month');
      });
  });

  it('shows cost-statistics endpoints in Scalar/OpenAPI', async () => {
    await request(getHttpServer(app))
      .get(OPENAPI_JSON_PATH)
      .expect(200)
      .expect((response) => {
        const openApi = response.body as { paths: Record<string, unknown> };

        expect(
          openApi.paths[`/${API_PREFIX}/thong-ke-chi-phi/theo-loai-thiet-bi`],
        ).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/thong-ke-chi-phi/theo-phong-ban`],
        ).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/thong-ke-chi-phi/theo-thoi-gian`],
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
