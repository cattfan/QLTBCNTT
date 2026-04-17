import { ConflictException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import type {
  LoginResponseDto,
  SuaChuaBaoTriActionResponseDto,
  SuaChuaBaoTriDto,
  SuaChuaBaoTriListResponseDto,
  SuaChuaBaoTriListQueryDto,
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
import { SuaChuaBaoTriService } from './../src/sua-chua-bao-tri/sua-chua-bao-tri.service';

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

class InMemorySuaChuaBaoTriService {
  constructor(private readonly tickets: SuaChuaBaoTriDto[]) {}

  findAll(
    query: SuaChuaBaoTriListQueryDto,
  ): Promise<SuaChuaBaoTriListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    let filteredItems = [...this.tickets];

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

  create(): Promise<SuaChuaBaoTriActionResponseDto> {
    return Promise.resolve({
      message: 'Tao phieu sua chua thanh cong',
      ticket: {
        id: 3,
        thietBiId: 3,
        ngayGhiNhan: '2026-04-17',
        ngaySuaChua: null,
        moTaLoi: 'Khong len nguon',
        loaiXuLy: 'phan_cung',
        donViSuaChua: null,
        chiPhi: 0,
        ketQuaXuLy: null,
        ghiChu: null,
        status: 'dang_xu_ly',
      },
    });
  }

  close(id: number): Promise<SuaChuaBaoTriActionResponseDto> {
    if (id === 2) {
      throw new ConflictException('Phieu sua chua da duoc dong truoc do');
    }

    return Promise.resolve({
      message: 'Dong phieu sua chua thanh cong',
      ticket: {
        id,
        thietBiId: 1,
        ngayGhiNhan: '2026-04-17',
        ngaySuaChua: '2026-04-18',
        moTaLoi: 'Khong len nguon',
        loaiXuLy: 'phan_cung',
        donViSuaChua: null,
        chiPhi: 1500000,
        ketQuaXuLy: 'Da thay nguon',
        ghiChu: 'Hoan thanh',
        status: 'da_hoan_thanh',
      },
    });
  }
}

describe('SuaChuaBaoTriController (e2e)', () => {
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

    const repairService = new InMemorySuaChuaBaoTriService([
      {
        id: 1,
        thietBiId: 1,
        ngayGhiNhan: '2026-04-17',
        ngaySuaChua: null,
        moTaLoi: 'Khong len nguon',
        loaiXuLy: 'phan_cung',
        donViSuaChua: null,
        chiPhi: 0,
        ketQuaXuLy: null,
        ghiChu: null,
        status: 'dang_xu_ly',
      },
      {
        id: 2,
        thietBiId: 2,
        ngayGhiNhan: '2026-04-10',
        ngaySuaChua: '2026-04-12',
        moTaLoi: 'Man hinh loi',
        loaiXuLy: 'phan_cung',
        donViSuaChua: 'Dell Service',
        chiPhi: 500000,
        ketQuaXuLy: 'Da thay man hinh',
        ghiChu: null,
        status: 'da_hoan_thanh',
      },
    ]);

    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    moduleBuilder.overrideProvider(USER_REPOSITORY).useValue(usersRepository);
    moduleBuilder
      .overrideProvider(SuaChuaBaoTriService)
      .useValue(repairService);
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

  it('lists repair tickets filtered by status', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/sua-chua-bao-tri?page=1&limit=10&status=dang_xu_ly`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as { data: SuaChuaBaoTriListResponseDto };
        expect(body.data.items).toHaveLength(1);
        expect(body.data.items[0]?.status).toBe('dang_xu_ly');
      });
  });

  it('creates and closes repair ticket', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .post(`/${API_PREFIX}/sua-chua-bao-tri`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        thietBiId: 3,
        moTaLoi: 'Khong len nguon',
        loaiXuLy: 'phan_cung',
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as { data: SuaChuaBaoTriActionResponseDto };
        expect(body.data.ticket.chiPhi).toBe(0);
      });

    await request(getHttpServer(app))
      .patch(`/${API_PREFIX}/sua-chua-bao-tri/1/close`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        chiPhi: 1500000,
        ketQuaXuLy: 'Da thay nguon',
        ghiChu: 'Hoan thanh',
      })
      .expect(200)
      .expect((response) => {
        const body = response.body as { data: SuaChuaBaoTriActionResponseDto };
        expect(body.data.ticket.status).toBe('da_hoan_thanh');
      });
  });

  it('refuses to close an already closed ticket', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .patch(`/${API_PREFIX}/sua-chua-bao-tri/2/close`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        chiPhi: 0,
      })
      .expect(409);
  });

  it('shows repair-maintenance endpoints in Scalar/OpenAPI', async () => {
    await request(getHttpServer(app))
      .get(OPENAPI_JSON_PATH)
      .expect(200)
      .expect((response) => {
        const openApi = response.body as { paths: Record<string, unknown> };

        expect(openApi.paths[`/${API_PREFIX}/sua-chua-bao-tri`]).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/sua-chua-bao-tri/{id}/close`],
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
