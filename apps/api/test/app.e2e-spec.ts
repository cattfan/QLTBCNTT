import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import type { LoginResponseDto } from '@repo/shared';
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

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let usersRepository: InMemoryUsersRepository;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.BCRYPT_SALT_ROUNDS = '4';

    usersRepository = new InMemoryUsersRepository([
      {
        id: 1,
        name: 'Administrator',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        departmentId: 2,
        passwordHash: await bcrypt.hash('old-password', 4),
      },
    ]);

    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    moduleBuilder.overrideProvider(USER_REPOSITORY).useValue(usersRepository);
    moduleBuilder.overrideProvider(SupabaseService).useValue({
      ping: jest.fn().mockResolvedValue(true),
      getClient: jest.fn(),
    });

    const moduleFixture: TestingModule = await moduleBuilder.compile();

    app = moduleFixture.createNestApplication();
    await setupApp(app);
    await app.init();
  });

  it('blocks protected routes without a token', () => {
    return request(getHttpServer(app)).get(`/${API_PREFIX}`).expect(401);
  });

  it('logs in with valid credentials', async () => {
    const response = await request(getHttpServer(app))
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        username: 'admin',
        password: 'old-password',
      })
      .expect(200);

    const body = response.body as WrappedResponse<LoginResponseDto>;

    expect(body.success).toBe(true);
    expect(body.data.accessToken).toEqual(expect.any(String));
    expect(body.data.user).toEqual({
      id: 1,
      name: 'Administrator',
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      departmentId: 2,
    });
  });

  it('returns current user from /auth/me', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/auth/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<{ user: UserRecord }>;

        expect(body.success).toBe(true);
        expect(body.data).toEqual({
          user: {
            id: 1,
            name: 'Administrator',
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin',
            departmentId: 2,
          },
        });
      });
  });

  it('changes password and invalidates the old password', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .patch(`/${API_PREFIX}/auth/change-password`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        oldPassword: 'old-password',
        newPassword: 'new-password',
      })
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<{ message: string }>;

        expect(body.success).toBe(true);
        expect(body.data).toEqual({
          message: 'Password changed successfully',
        });
      });

    await request(getHttpServer(app))
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        username: 'admin',
        password: 'old-password',
      })
      .expect(401);

    await request(getHttpServer(app))
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        username: 'admin',
        password: 'new-password',
      })
      .expect(200);
  });

  it('serves Scalar docs and OpenAPI JSON under /v1', async () => {
    await request(getHttpServer(app))
      .get(OPENAPI_JSON_PATH)
      .expect(200)
      .expect((response) => {
        const openApi = response.body as {
          openapi: string;
          paths: Record<string, unknown>;
        };

        expect(openApi.openapi).toEqual(expect.any(String));
        expect(openApi.paths[`/${API_PREFIX}/auth/login`]).toBeDefined();
      });

    await request(getHttpServer(app))
      .get(API_DOCS_PATH)
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('Scalar');
        expect(response.text).toContain(OPENAPI_JSON_PATH);
      });
  });

  afterEach(async () => {
    await app.close();
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

  const body = response.body as WrappedResponse<LoginResponseDto>;
  return body.data.accessToken;
}

function getHttpServer(app: INestApplication): Parameters<typeof request>[0] {
  return app.getHttpServer() as Parameters<typeof request>[0];
}

interface WrappedResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
