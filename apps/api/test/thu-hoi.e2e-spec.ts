import { ConflictException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import type {
  CreateThuHoiDto,
  LoginResponseDto,
  ThuHoiResponseDto,
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
import { ThuHoiService } from './../src/thu-hoi/thu-hoi.service';

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

class InMemoryThuHoiService {
  private readonly openHandoverIds = new Set<number>([1]);

  create(payload: CreateThuHoiDto): Promise<ThuHoiResponseDto> {
    if (!this.openHandoverIds.has(payload.thietBiId)) {
      throw new ConflictException(
        'Thiet bi hien khong co ban ghi ban giao dang mo',
      );
    }

    return Promise.resolve({
      message: 'Thu hoi thiet bi thanh cong',
      handover: {
        id: 10,
        thietBiId: payload.thietBiId,
        nguoiNhanId: 2,
        phongBanNhanId: 3,
        ngayBanGiao: '2026-04-16',
        ngayThuHoi: '2026-04-17',
        hinhThuc: 'ban_giao',
        noiDung: null,
        ghiChu: payload.ghiChu ?? null,
      },
    });
  }
}

describe('ThuHoiController (e2e)', () => {
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

    const thuHoiService = new InMemoryThuHoiService();

    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    moduleBuilder.overrideProvider(USER_REPOSITORY).useValue(usersRepository);
    moduleBuilder.overrideProvider(ThuHoiService).useValue(thuHoiService);
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

  it('updates open handover and returns recall result', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .post(`/${API_PREFIX}/thu-hoi`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        thietBiId: 1,
        ghiChu: 'Thu hoi ve kho',
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as { data: ThuHoiResponseDto };

        expect(body.data.message).toBe('Thu hoi thiet bi thanh cong');
        expect(body.data.handover.ngayThuHoi).toBe('2026-04-17');
        expect(body.data.handover.thietBiId).toBe(1);
      });
  });

  it('refuses recall when no active handover exists', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .post(`/${API_PREFIX}/thu-hoi`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        thietBiId: 99,
      })
      .expect(409);
  });

  it('shows recall endpoint in Scalar/OpenAPI', async () => {
    await request(getHttpServer(app))
      .get(OPENAPI_JSON_PATH)
      .expect(200)
      .expect((response) => {
        const openApi = response.body as { paths: Record<string, unknown> };

        expect(openApi.paths[`/${API_PREFIX}/thu-hoi`]).toBeDefined();
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
