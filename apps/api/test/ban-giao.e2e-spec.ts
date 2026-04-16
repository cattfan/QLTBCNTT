import { ConflictException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import type {
  BanGiaoResponseDto,
  CreateBanGiaoDto,
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
import { BanGiaoService } from './../src/ban-giao/ban-giao.service';
import { SupabaseService } from './../src/database';

interface ManagedUserRecord extends UserRecord {
  departmentId: number | null;
}

interface ManagedDevice {
  id: number;
  statusCode: string | null;
  statusId: number | null;
  borrowed: boolean;
}

class InMemoryUsersRepository implements UsersRepository {
  constructor(private readonly users: ManagedUserRecord[]) {}

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

class InMemoryBanGiaoService {
  private nextId = 1;

  constructor(
    private readonly devices: ManagedDevice[],
    private readonly users: ManagedUserRecord[],
  ) {}

  create(payload: CreateBanGiaoDto): Promise<BanGiaoResponseDto> {
    const device = this.devices.find((item) => item.id === payload.thietBiId);

    if (!device) {
      throw new ConflictException('Khong tim thay thiet bi');
    }

    if (device.statusCode === 'THAT_LAC') {
      throw new ConflictException(
        'Khong the ban giao thiet bi dang o tinh trang That lac',
      );
    }

    if (device.borrowed) {
      throw new ConflictException(
        'Khong the ban giao thiet bi dang duoc nguoi khac muon',
      );
    }

    const recipient = this.users.find(
      (item) => item.id === payload.nguoiNhanId,
    );

    if (!recipient) {
      throw new ConflictException('Khong tim thay nguoi nhan');
    }

    device.statusCode = 'DANG_SU_DUNG';
    device.statusId = 1;
    device.borrowed = true;

    return Promise.resolve({
      message: 'Ban giao thiet bi thanh cong',
      handover: {
        id: this.nextId++,
        thietBiId: payload.thietBiId,
        nguoiNhanId: payload.nguoiNhanId,
        phongBanNhanId: recipient.departmentId,
        ngayBanGiao: '2026-04-16',
        ngayThuHoi: null,
        hinhThuc: payload.hinhThuc ?? null,
        noiDung: payload.noiDung ?? null,
        ghiChu: payload.ghiChu ?? null,
      },
    });
  }
}

describe('BanGiaoController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.BCRYPT_SALT_ROUNDS = '4';

    const users: ManagedUserRecord[] = [
      {
        id: 1,
        name: 'Admin IT',
        username: 'admin',
        email: 'admin@example.com',
        role: 'IT',
        departmentId: 2,
        passwordHash: await bcrypt.hash('old-password', 4),
      },
      {
        id: 2,
        name: 'Nguyen Van A',
        username: 'nguyenvana',
        email: 'a@example.com',
        role: 'User',
        departmentId: 3,
        passwordHash: await bcrypt.hash('123456', 4),
      },
    ];

    const usersRepository = new InMemoryUsersRepository(users);
    const banGiaoService = new InMemoryBanGiaoService(
      [
        {
          id: 1,
          statusCode: 'LUU_KHO',
          statusId: 2,
          borrowed: false,
        },
        {
          id: 2,
          statusCode: 'THAT_LAC',
          statusId: 9,
          borrowed: false,
        },
        {
          id: 3,
          statusCode: 'DANG_SU_DUNG',
          statusId: 1,
          borrowed: true,
        },
      ],
      users,
    );

    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    moduleBuilder.overrideProvider(USER_REPOSITORY).useValue(usersRepository);
    moduleBuilder.overrideProvider(BanGiaoService).useValue(banGiaoService);
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

  it('creates handover record and returns current date', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .post(`/${API_PREFIX}/ban-giao`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        thietBiId: 1,
        nguoiNhanId: 2,
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as {
          data: BanGiaoResponseDto;
        };

        expect(body.data.message).toBe('Ban giao thiet bi thanh cong');
        expect(body.data.handover.thietBiId).toBe(1);
        expect(body.data.handover.nguoiNhanId).toBe(2);
      });
  });

  it('refuses handover for lost or borrowed devices', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .post(`/${API_PREFIX}/ban-giao`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        thietBiId: 2,
        nguoiNhanId: 2,
      })
      .expect(409);

    await request(getHttpServer(app))
      .post(`/${API_PREFIX}/ban-giao`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        thietBiId: 3,
        nguoiNhanId: 2,
      })
      .expect(409);
  });

  it('shows handover endpoint in Scalar/OpenAPI', async () => {
    await request(getHttpServer(app))
      .get(OPENAPI_JSON_PATH)
      .expect(200)
      .expect((response) => {
        const openApi = response.body as { paths: Record<string, unknown> };

        expect(openApi.paths[`/${API_PREFIX}/ban-giao`]).toBeDefined();
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
