import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  API_DOCS_PATH,
  API_PREFIX,
  OPENAPI_JSON_PATH,
  setupApp,
} from '../src/app.setup';
import { USER_REPOSITORY } from '../src/auth/auth.constants';
import type { UserRecord, UsersRepository } from '../src/auth/users.repository';
import { SupabaseService } from '../src/database';
import { XuatBaoCaoService } from '../src/xuat-bao-cao/xuat-bao-cao.service';

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

class InMemoryXuatBaoCaoService {
  exportThietBiExcel = jest.fn().mockResolvedValue({
    filename: 'danh-sach-thiet-bi-test.xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    content: Buffer.from('excel-bytes'),
  });

  exportBanGiaoPdf = jest.fn().mockResolvedValue({
    filename: 'bien-ban-ban-giao-test.pdf',
    mimeType: 'application/pdf',
    content: Buffer.from('%PDF-test-content'),
  });
}

interface BinaryHttpResponse {
  body: Buffer;
  headers: Record<string, string>;
}

interface HtmlHttpResponse {
  text: string;
}

interface LoginHttpResponse {
  body: {
    data: {
      accessToken: string;
    };
  };
}

interface OpenApiHttpResponse {
  body: {
    paths: Record<
      string,
      {
        get: {
          responses: Record<
            string,
            {
              content: Record<string, unknown>;
            }
          >;
        };
      }
    >;
  };
}

interface BinaryParserResponse {
  on(event: 'data', handler: (chunk: Buffer | string) => void): void;
  on(event: 'end', handler: () => void): void;
  on(event: 'error', handler: (error: Error) => void): void;
}

describe('XuatBaoCaoController (e2e)', () => {
  let app: INestApplication;
  let usersRepository: InMemoryUsersRepository;
  let xuatBaoCaoService: InMemoryXuatBaoCaoService;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.BCRYPT_SALT_ROUNDS = '4';

    usersRepository = new InMemoryUsersRepository([
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
    xuatBaoCaoService = new InMemoryXuatBaoCaoService();

    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    moduleBuilder.overrideProvider(USER_REPOSITORY).useValue(usersRepository);
    moduleBuilder
      .overrideProvider(XuatBaoCaoService)
      .useValue(xuatBaoCaoService);
    moduleBuilder.overrideProvider(SupabaseService).useValue({
      ping: jest.fn().mockResolvedValue(true),
      getClient: jest.fn(),
    });

    const moduleFixture: TestingModule = await moduleBuilder.compile();
    app = moduleFixture.createNestApplication();
    await setupApp(app);
    await app.init();
  });

  it('downloads device report as excel without JSON wrapping', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/xuat-bao-cao/thiet-bi/excel?search=laptop`)
      .set('Authorization', `Bearer ${accessToken}`)
      .buffer(true)
      .parse(binaryParser)
      .expect(200)
      .expect((response: BinaryHttpResponse) => {
        expect(response.headers['content-type']).toContain(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        expect(response.headers['content-disposition']).toContain(
          'danh-sach-thiet-bi-test.xlsx',
        );
        expect(Buffer.isBuffer(response.body)).toBe(true);
        expect(response.body.toString()).toBe('excel-bytes');
        expect(xuatBaoCaoService.exportThietBiExcel).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'laptop',
          }),
        );
      });
  });

  it('downloads handover minute as pdf with current user in payload', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/xuat-bao-cao/ban-giao/7/pdf`)
      .set('Authorization', `Bearer ${accessToken}`)
      .buffer(true)
      .parse(binaryParser)
      .expect(200)
      .expect((response: BinaryHttpResponse) => {
        expect(response.headers['content-type']).toContain('application/pdf');
        expect(response.headers['content-disposition']).toContain(
          'bien-ban-ban-giao-test.pdf',
        );
        expect(response.body.toString()).toBe('%PDF-test-content');
        expect(xuatBaoCaoService.exportBanGiaoPdf).toHaveBeenCalledWith(
          7,
          expect.objectContaining({
            name: 'Administrator',
            username: 'admin',
          }),
        );
      });
  });

  it('publishes export-report endpoints in OpenAPI and serves Scalar docs', async () => {
    await request(getHttpServer(app))
      .get(OPENAPI_JSON_PATH)
      .expect(200)
      .expect((response: OpenApiHttpResponse) => {
        const openApi = response.body;

        expect(
          openApi.paths[`/${API_PREFIX}/xuat-bao-cao/thiet-bi/excel`],
        ).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/xuat-bao-cao/ban-giao/{id}/pdf`],
        ).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/xuat-bao-cao/thiet-bi/excel`].get
            .responses['200'].content[
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ],
        ).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/xuat-bao-cao/ban-giao/{id}/pdf`].get
            .responses['200'].content['application/pdf'],
        ).toBeDefined();
      });

    await request(getHttpServer(app))
      .get(API_DOCS_PATH)
      .expect(200)
      .expect((response: HtmlHttpResponse) => {
        expect(response.text).toContain('Scalar');
        expect(response.text).toContain(OPENAPI_JSON_PATH);
      });
  });

  afterEach(async () => {
    await app.close();
  });
});

async function login(app: INestApplication): Promise<string> {
  const response = (await request(getHttpServer(app))
    .post(`/${API_PREFIX}/auth/login`)
    .send({
      username: 'admin',
      password: 'old-password',
    })
    .expect(200)) as LoginHttpResponse;

  return response.body.data.accessToken;
}

function getHttpServer(app: INestApplication): Parameters<typeof request>[0] {
  return app.getHttpServer() as Parameters<typeof request>[0];
}

function binaryParser(
  response: BinaryParserResponse,
  callback: (error: Error | null, body: Buffer) => void,
): void {
  const chunks: Buffer[] = [];

  response.on('data', (chunk) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  response.on('end', () => {
    callback(null, Buffer.concat(chunks));
  });
  response.on('error', (error) => {
    callback(error, Buffer.alloc(0));
  });
}
