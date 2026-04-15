import {
  ConflictException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import type {
  ActionMessageResponseDto,
  CreateNguoiDungDto,
  LoginResponseDto,
  NguoiDungDto,
  NguoiDungListResponseDto,
  NguoiDungQueryDto,
  SetNguoiDungRoleDto,
  UpdateNguoiDungDto,
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
import { NguoiDungService } from './../src/nguoi-dung/nguoi-dung.service';

interface ManagedUserRecord extends UserRecord {
  phoneNumber: string | null;
  isActive: boolean;
}

class InMemoryUsersRepository implements UsersRepository {
  constructor(private readonly users: ManagedUserRecord[]) {}

  findById(id: number): Promise<UserRecord | null> {
    const user = this.users.find((item) => item.id === id);
    return Promise.resolve(user ?? null);
  }

  findByUsername(username: string): Promise<UserRecord | null> {
    const user = this.users.find((item) => item.username === username);
    return Promise.resolve(user ?? null);
  }

  updatePassword(userId: number, passwordHash: string): Promise<void> {
    const user = this.users.find((item) => item.id === userId);

    if (user) {
      user.passwordHash = passwordHash;
    }

    return Promise.resolve();
  }
}

class InMemoryNguoiDungService {
  constructor(private readonly users: ManagedUserRecord[]) {}

  findAll(query: NguoiDungQueryDto): Promise<NguoiDungListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    let filteredUsers = [...this.users];

    if (query.role) {
      filteredUsers = filteredUsers.filter((user) => user.role === query.role);
    }

    if (query.departmentId !== undefined) {
      filteredUsers = filteredUsers.filter(
        (user) => user.departmentId === query.departmentId,
      );
    }

    const offset = (page - 1) * limit;

    return Promise.resolve({
      items: filteredUsers.slice(offset, offset + limit).map((user) => ({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        departmentId: user.departmentId,
        isActive: user.isActive,
        role: user.role === 'IT' ? 'IT' : 'User',
      })),
      total: filteredUsers.length,
      page,
      limit,
      totalPages: Math.ceil(filteredUsers.length / limit),
    });
  }

  async create(payload: CreateNguoiDungDto): Promise<NguoiDungDto> {
    if (this.users.some((user) => user.username === payload.username)) {
      throw new ConflictException('Ten dang nhap da ton tai');
    }

    const nextUser: ManagedUserRecord = {
      id: Math.max(...this.users.map((item) => item.id)) + 1,
      name: payload.name.trim(),
      username: payload.username.trim(),
      email: payload.email ?? null,
      phoneNumber: payload.phoneNumber ?? null,
      departmentId: payload.departmentId ?? null,
      isActive: true,
      role: payload.role ?? 'User',
      passwordHash: await bcrypt.hash('123456', 4),
    };

    this.users.push(nextUser);

    return this.toDto(nextUser);
  }

  update(id: number, payload: UpdateNguoiDungDto): Promise<NguoiDungDto> {
    const user = this.users.find((item) => item.id === id);

    if (!user) {
      throw new NotFoundException('Khong tim thay tai khoan');
    }

    user.name = payload.name.trim();
    user.email = payload.email ?? null;
    user.phoneNumber = payload.phoneNumber ?? null;
    user.departmentId = payload.departmentId ?? null;

    return Promise.resolve(this.toDto(user));
  }

  async resetPassword(id: number): Promise<ActionMessageResponseDto> {
    const user = this.users.find((item) => item.id === id);

    if (!user) {
      throw new NotFoundException('Khong tim thay tai khoan');
    }

    user.passwordHash = await bcrypt.hash('123456', 4);

    return {
      message: 'Dat lai mat khau mac dinh thanh cong',
    };
  }

  lock(id: number): Promise<ActionMessageResponseDto> {
    const user = this.users.find((item) => item.id === id);

    if (!user) {
      throw new NotFoundException('Khong tim thay tai khoan');
    }

    user.isActive = false;

    return Promise.resolve({
      message: 'Khoa tai khoan thanh cong',
    });
  }

  unlock(id: number): Promise<ActionMessageResponseDto> {
    const user = this.users.find((item) => item.id === id);

    if (!user) {
      throw new NotFoundException('Khong tim thay tai khoan');
    }

    user.isActive = true;

    return Promise.resolve({
      message: 'Mo khoa tai khoan thanh cong',
    });
  }

  setRole(
    id: number,
    payload: SetNguoiDungRoleDto,
  ): Promise<ActionMessageResponseDto> {
    const user = this.users.find((item) => item.id === id);

    if (!user) {
      throw new NotFoundException('Khong tim thay tai khoan');
    }

    user.role = payload.role;

    return Promise.resolve({
      message: 'Gan vai tro thanh cong',
    });
  }

  private toDto(user: ManagedUserRecord): NguoiDungDto {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      departmentId: user.departmentId,
      isActive: user.isActive,
      role: user.role === 'IT' ? 'IT' : 'User',
    };
  }
}

describe('NguoiDungController (e2e)', () => {
  let app: INestApplication;
  let users: ManagedUserRecord[];

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.BCRYPT_SALT_ROUNDS = '4';
    process.env.DEFAULT_USER_PASSWORD = '123456';

    users = [
      {
        id: 1,
        name: 'Admin IT',
        username: 'admin',
        email: 'admin@example.com',
        phoneNumber: '0901234567',
        departmentId: 1,
        isActive: true,
        role: 'IT',
        passwordHash: await bcrypt.hash('old-password', 4),
      },
      {
        id: 2,
        name: 'Nguyen Van B',
        username: 'userb',
        email: 'b@example.com',
        phoneNumber: '0907654321',
        departmentId: 2,
        isActive: true,
        role: 'User',
        passwordHash: await bcrypt.hash('123456', 4),
      },
    ];

    const usersRepository = new InMemoryUsersRepository(users);
    const nguoiDungService = new InMemoryNguoiDungService(users);

    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    moduleBuilder.overrideProvider(USER_REPOSITORY).useValue(usersRepository);
    moduleBuilder.overrideProvider(NguoiDungService).useValue(nguoiDungService);
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

  it('lists accounts filtered by role and department without password', async () => {
    const accessToken = await login(app, 'admin', 'old-password');

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/nguoi-dung?role=User&departmentId=2`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<NguoiDungListResponseDto>;

        expect(body.data.items).toEqual([
          {
            id: 2,
            name: 'Nguyen Van B',
            username: 'userb',
            email: 'b@example.com',
            phoneNumber: '0907654321',
            departmentId: 2,
            isActive: true,
            role: 'User',
          },
        ]);
        expect(JSON.stringify(response.body)).not.toContain('mat_khau');
        expect(JSON.stringify(response.body)).not.toContain('passwordHash');
      });
  });

  it('creates employee with default password hash and unique username check', async () => {
    const accessToken = await login(app, 'admin', 'old-password');

    const createResponse = await request(getHttpServer(app))
      .post(`/${API_PREFIX}/nguoi-dung`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Nguyen Van C',
        username: 'userc',
        email: 'c@example.com',
        phoneNumber: '0901111222',
        departmentId: 3,
        role: 'User',
      })
      .expect(201);

    const createdBody = createResponse.body as WrappedResponse<NguoiDungDto>;

    expect(createdBody.data).toEqual({
      id: 3,
      name: 'Nguyen Van C',
      username: 'userc',
      email: 'c@example.com',
      phoneNumber: '0901111222',
      departmentId: 3,
      isActive: true,
      role: 'User',
    });

    await expect(bcrypt.compare('123456', users[2].passwordHash)).resolves.toBe(
      true,
    );

    await request(getHttpServer(app))
      .post(`/${API_PREFIX}/nguoi-dung`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Duplicate User',
        username: 'userc',
      })
      .expect(409);
  });

  it('does not allow changing username on update', async () => {
    const accessToken = await login(app, 'admin', 'old-password');

    await request(getHttpServer(app))
      .put(`/${API_PREFIX}/nguoi-dung/2`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Nguyen Van B Updated',
        username: 'newusername',
      })
      .expect(400);
  });

  it('supports IT actions: reset password, lock/unlock account, assign role', async () => {
    const accessToken = await login(app, 'admin', 'old-password');

    await request(getHttpServer(app))
      .patch(`/${API_PREFIX}/nguoi-dung/2/reset-password`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await expect(bcrypt.compare('123456', users[1].passwordHash)).resolves.toBe(
      true,
    );

    await request(getHttpServer(app))
      .patch(`/${API_PREFIX}/nguoi-dung/2/lock`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(users[1].isActive).toBe(false);

    await request(getHttpServer(app))
      .patch(`/${API_PREFIX}/nguoi-dung/2/unlock`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(users[1].isActive).toBe(true);

    await request(getHttpServer(app))
      .patch(`/${API_PREFIX}/nguoi-dung/2/role`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        role: 'IT',
      })
      .expect(200);

    expect(users[1].role).toBe('IT');
  });

  it('shows user-management endpoints in Scalar/OpenAPI', async () => {
    await request(getHttpServer(app))
      .get(OPENAPI_JSON_PATH)
      .expect(200)
      .expect((response) => {
        const openApi = response.body as {
          paths: Record<string, unknown>;
        };

        expect(openApi.paths[`/${API_PREFIX}/nguoi-dung`]).toBeDefined();
        expect(openApi.paths[`/${API_PREFIX}/nguoi-dung/{id}`]).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/nguoi-dung/{id}/reset-password`],
        ).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/nguoi-dung/{id}/lock`],
        ).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/nguoi-dung/{id}/unlock`],
        ).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/nguoi-dung/{id}/role`],
        ).toBeDefined();
      });

    await request(getHttpServer(app))
      .get(API_DOCS_PATH)
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('Scalar');
        expect(response.text).toContain(OPENAPI_JSON_PATH);
      });
  });
});

async function login(
  app: INestApplication,
  username: string,
  password: string,
): Promise<string> {
  const response = await request(getHttpServer(app))
    .post(`/${API_PREFIX}/auth/login`)
    .send({
      username,
      password,
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
