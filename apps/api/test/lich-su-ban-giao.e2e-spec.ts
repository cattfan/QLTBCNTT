import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import type {
  LichSuBanGiaoDto,
  LichSuBanGiaoListResponseDto,
  LichSuBanGiaoQueryDto,
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
import { LichSuBanGiaoService } from './../src/lich-su-ban-giao/lich-su-ban-giao.service';

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

class InMemoryLichSuBanGiaoService {
  constructor(private readonly items: LichSuBanGiaoDto[]) {}

  findAll(query: LichSuBanGiaoQueryDto): Promise<LichSuBanGiaoListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    let filteredItems = [...this.items];

    if (query.employeeCode) {
      const keyword = query.employeeCode.toLowerCase();
      filteredItems = filteredItems.filter((item) =>
        item.employeeCode?.toLowerCase().includes(keyword),
      );
    }

    if (query.deviceCode) {
      const keyword = query.deviceCode.toLowerCase();
      filteredItems = filteredItems.filter((item) =>
        item.thietBiCode.toLowerCase().includes(keyword),
      );
    }

    if (query.status) {
      filteredItems = filteredItems.filter(
        (item) => item.status === query.status,
      );
    }

    const offset = (page - 1) * limit;

    return Promise.resolve({
      items: filteredItems.slice(offset, offset + limit),
      total: filteredItems.length,
      page,
      limit,
      totalPages: Math.ceil(filteredItems.length / limit),
    });
  }
}

describe('LichSuBanGiaoController (e2e)', () => {
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

    const lichSuService = new InMemoryLichSuBanGiaoService([
      {
        id: 1,
        thietBiId: 1,
        thietBiCode: 'TB-001',
        thietBiName: 'Laptop Dell Latitude',
        nguoiNhanId: 2,
        employeeCode: 'nguyenvana',
        employeeName: 'Nguyen Van A',
        phongBanNhanId: 3,
        handoverDate: '2026-04-16',
        returnDate: null,
        status: 'dang_muon',
        handoverType: 'ban_giao',
        content: 'Cap cho nhan vien moi',
        note: null,
      },
      {
        id: 2,
        thietBiId: 2,
        thietBiCode: 'TB-002',
        thietBiName: 'May in HP',
        nguoiNhanId: 3,
        employeeCode: 'nguyenvanb',
        employeeName: 'Nguyen Van B',
        phongBanNhanId: 4,
        handoverDate: '2026-04-10',
        returnDate: '2026-04-12',
        status: 'da_tra',
        handoverType: 'ban_giao',
        content: null,
        note: 'Da tra ve kho',
      },
    ]);

    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    moduleBuilder.overrideProvider(USER_REPOSITORY).useValue(usersRepository);
    moduleBuilder
      .overrideProvider(LichSuBanGiaoService)
      .useValue(lichSuService);
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

  it('lists handover history filtered by employee code, device code and status', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(
        `/${API_PREFIX}/lich-su-ban-giao?page=1&limit=10&employeeCode=nguyenvana&deviceCode=TB-001&status=dang_muon`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as { data: LichSuBanGiaoListResponseDto };

        expect(body.data.items).toEqual([
          {
            id: 1,
            thietBiId: 1,
            thietBiCode: 'TB-001',
            thietBiName: 'Laptop Dell Latitude',
            nguoiNhanId: 2,
            employeeCode: 'nguyenvana',
            employeeName: 'Nguyen Van A',
            phongBanNhanId: 3,
            handoverDate: '2026-04-16',
            returnDate: null,
            status: 'dang_muon',
            handoverType: 'ban_giao',
            content: 'Cap cho nhan vien moi',
            note: null,
          },
        ]);
      });
  });

  it('shows handover-history endpoint in Scalar/OpenAPI', async () => {
    await request(getHttpServer(app))
      .get(OPENAPI_JSON_PATH)
      .expect(200)
      .expect((response) => {
        const openApi = response.body as { paths: Record<string, unknown> };

        expect(openApi.paths[`/${API_PREFIX}/lich-su-ban-giao`]).toBeDefined();
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
