import {
  ConflictException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import type {
  CreatePhongBanDto,
  CreateLoaiThietBiDto,
  LoaiThietBiDto,
  LoaiThietBiListResponseDto,
  LoaiThietBiQueryDto,
  LoginResponseDto,
  PhongBanDto,
  PhongBanListResponseDto,
  PhongBanQueryDto,
  UpdateLoaiThietBiDto,
  UpdatePhongBanDto,
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
import { LoaiThietBiService } from './../src/loai-thiet-bi/loai-thiet-bi.service';
import { PhongBanService } from './../src/phong-ban/phong-ban.service';

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

class InMemoryPhongBanService {
  private readonly linkedDepartmentIds = new Set<number>([2]);

  constructor(private readonly departments: PhongBanDto[]) {}

  findAll(query: PhongBanQueryDto): Promise<PhongBanListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim().toLowerCase();

    const filteredDepartments = search
      ? this.departments.filter(
          (department) =>
            department.maPhongBan.toLowerCase().includes(search) ||
            department.tenPhongBan.toLowerCase().includes(search),
        )
      : [...this.departments];

    const offset = (page - 1) * limit;
    const items = filteredDepartments.slice(offset, offset + limit);
    const total = filteredDepartments.length;

    return Promise.resolve({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  findById(id: number): Promise<PhongBanDto> {
    const department = this.departments.find((item) => item.id === id);

    if (!department) {
      throw new NotFoundException('Không tìm thấy phòng ban');
    }

    return Promise.resolve(department);
  }

  create(payload: CreatePhongBanDto): Promise<PhongBanDto> {
    const nextCode = payload.maPhongBan.trim();
    const nextName = payload.tenPhongBan.trim();

    if (!nextCode) {
      throw new ConflictException('Mã phòng ban không được để trống');
    }

    if (this.departments.some((item) => item.maPhongBan === nextCode)) {
      throw new ConflictException('Mã phòng ban đã tồn tại');
    }

    const nextDepartment: PhongBanDto = {
      id: Math.max(...this.departments.map((item) => item.id)) + 1,
      maPhongBan: nextCode,
      tenPhongBan: nextName,
      ghiChu: payload.ghiChu?.trim() || null,
    };

    this.departments.push(nextDepartment);
    return Promise.resolve(nextDepartment);
  }

  update(id: number, payload: UpdatePhongBanDto): Promise<PhongBanDto> {
    const department = this.departments.find((item) => item.id === id);

    if (!department) {
      throw new NotFoundException('Không tìm thấy phòng ban');
    }

    const nextCode = payload.maPhongBan.trim();
    const nextName = payload.tenPhongBan.trim();

    if (!nextCode) {
      throw new ConflictException('Mã phòng ban không được để trống');
    }

    if (
      this.departments.some(
        (item) => item.id !== id && item.maPhongBan === nextCode,
      )
    ) {
      throw new ConflictException('Mã phòng ban đã tồn tại');
    }

    department.maPhongBan = nextCode;
    department.tenPhongBan = nextName;
    department.ghiChu = payload.ghiChu?.trim() || null;

    return Promise.resolve(department);
  }

  remove(id: number): Promise<{ message: string }> {
    const departmentIndex = this.departments.findIndex(
      (item) => item.id === id,
    );

    if (departmentIndex < 0) {
      throw new NotFoundException('Không tìm thấy phòng ban');
    }

    if (this.linkedDepartmentIds.has(id)) {
      throw new ConflictException(
        'Không thể xóa phòng ban đang có nhân viên hoặc thiết bị liên kết',
      );
    }

    this.departments.splice(departmentIndex, 1);

    return Promise.resolve({
      message: 'Xóa phòng ban thành công',
    });
  }
}

class InMemoryLoaiThietBiService {
  private readonly linkedCategoryIds = new Set<number>([2]);

  constructor(private readonly categories: LoaiThietBiDto[]) {}

  findAll(query: LoaiThietBiQueryDto): Promise<LoaiThietBiListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim().toLowerCase();

    const filteredCategories = search
      ? this.categories.filter((category) =>
          category.tenLoai.toLowerCase().includes(search),
        )
      : [...this.categories];

    const offset = (page - 1) * limit;
    const items = filteredCategories.slice(offset, offset + limit);
    const total = filteredCategories.length;

    return Promise.resolve({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  findById(id: number): Promise<LoaiThietBiDto> {
    const category = this.categories.find((item) => item.id === id);

    if (!category) {
      throw new NotFoundException('Không tìm thấy loại thiết bị');
    }

    return Promise.resolve(category);
  }

  create(payload: CreateLoaiThietBiDto): Promise<LoaiThietBiDto> {
    const nextCode = payload.maLoai.trim();
    const nextName = payload.tenLoai.trim();

    if (!nextCode) {
      throw new ConflictException('Mã danh mục không được để trống');
    }

    if (this.categories.some((item) => item.maLoai === nextCode)) {
      throw new ConflictException('Mã danh mục đã tồn tại');
    }

    const nextCategory: LoaiThietBiDto = {
      id: Math.max(...this.categories.map((item) => item.id)) + 1,
      maLoai: nextCode,
      tenLoai: nextName,
      ghiChu: payload.ghiChu?.trim() || null,
    };

    this.categories.push(nextCategory);
    return Promise.resolve(nextCategory);
  }

  update(id: number, payload: UpdateLoaiThietBiDto): Promise<LoaiThietBiDto> {
    const category = this.categories.find((item) => item.id === id);

    if (!category) {
      throw new NotFoundException('Không tìm thấy loại thiết bị');
    }

    const nextCode = payload.maLoai.trim();
    const nextName = payload.tenLoai.trim();

    if (!nextCode) {
      throw new ConflictException('Mã danh mục không được để trống');
    }

    if (
      this.categories.some((item) => item.id !== id && item.maLoai === nextCode)
    ) {
      throw new ConflictException('Mã danh mục đã tồn tại');
    }

    category.maLoai = nextCode;
    category.tenLoai = nextName;
    category.ghiChu = payload.ghiChu?.trim() || null;

    return Promise.resolve(category);
  }

  remove(id: number): Promise<{ message: string }> {
    const categoryIndex = this.categories.findIndex((item) => item.id === id);

    if (categoryIndex < 0) {
      throw new NotFoundException('Không tìm thấy loại thiết bị');
    }

    if (this.linkedCategoryIds.has(id)) {
      throw new ConflictException(
        'Không thể xóa loại thiết bị đang có thiết bị liên kết',
      );
    }

    this.categories.splice(categoryIndex, 1);

    return Promise.resolve({
      message: 'Xóa loại thiết bị thành công',
    });
  }
}

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let usersRepository: InMemoryUsersRepository;
  let phongBanService: InMemoryPhongBanService;
  let loaiThietBiService: InMemoryLoaiThietBiService;

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
    phongBanService = new InMemoryPhongBanService([
      {
        id: 1,
        maPhongBan: 'PB-KT',
        tenPhongBan: 'Phòng Kế toán',
        ghiChu: 'Theo dõi tài chính',
      },
      {
        id: 2,
        maPhongBan: 'PB-HC',
        tenPhongBan: 'Phòng Hành chính',
        ghiChu: null,
      },
    ]);
    loaiThietBiService = new InMemoryLoaiThietBiService([
      {
        id: 1,
        maLoai: 'LT-LAPTOP',
        tenLoai: 'Laptop',
        ghiChu: 'Thiết bị máy tính xách tay',
      },
      {
        id: 2,
        maLoai: 'LT-PRINTER',
        tenLoai: 'Máy in',
        ghiChu: null,
      },
    ]);

    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    moduleBuilder
      .overrideProvider(LoaiThietBiService)
      .useValue(loaiThietBiService);
    moduleBuilder.overrideProvider(USER_REPOSITORY).useValue(usersRepository);
    moduleBuilder.overrideProvider(PhongBanService).useValue(phongBanService);
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

  it('lists departments with pagination and search', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/phong-ban?page=1&limit=10&search=kế`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<PhongBanListResponseDto>;

        expect(body.success).toBe(true);
        expect(body.data.items).toEqual([
          {
            id: 1,
            maPhongBan: 'PB-KT',
            tenPhongBan: 'Phòng Kế toán',
            ghiChu: 'Theo dõi tài chính',
          },
        ]);
        expect(body.data.total).toBe(1);
      });
  });

  it('returns department detail by id', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/phong-ban/1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<PhongBanDto>;

        expect(body.success).toBe(true);
        expect(body.data).toEqual({
          id: 1,
          maPhongBan: 'PB-KT',
          tenPhongBan: 'Phòng Kế toán',
          ghiChu: 'Theo dõi tài chính',
        });
      });
  });

  it('creates and updates a department', async () => {
    const accessToken = await login(app);

    const createResponse = await request(getHttpServer(app))
      .post(`/${API_PREFIX}/phong-ban`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        maPhongBan: 'PB-IT',
        tenPhongBan: 'Phòng Công nghệ thông tin',
        ghiChu: 'Quản trị hạ tầng',
      })
      .expect(201);

    const createdBody = createResponse.body as WrappedResponse<PhongBanDto>;
    expect(createdBody.data).toEqual({
      id: 3,
      maPhongBan: 'PB-IT',
      tenPhongBan: 'Phòng Công nghệ thông tin',
      ghiChu: 'Quản trị hạ tầng',
    });

    await request(getHttpServer(app))
      .put(`/${API_PREFIX}/phong-ban/3`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        maPhongBan: 'PB-CNTT',
        tenPhongBan: 'Phòng CNTT',
        ghiChu: 'Hạ tầng và hỗ trợ',
      })
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<PhongBanDto>;

        expect(body.data).toEqual({
          id: 3,
          maPhongBan: 'PB-CNTT',
          tenPhongBan: 'Phòng CNTT',
          ghiChu: 'Hạ tầng và hỗ trợ',
        });
      });
  });

  it('rejects duplicate department code', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .post(`/${API_PREFIX}/phong-ban`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        maPhongBan: 'PB-KT',
        tenPhongBan: 'Phòng tài chính',
        ghiChu: null,
      })
      .expect(409)
      .expect((response) => {
        const body = response.body as WrappedErrorResponse;

        expect(body.success).toBe(false);
        expect(body.message).toContain('Mã phòng ban đã tồn tại');
      });
  });

  it('refuses to delete a linked department', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .delete(`/${API_PREFIX}/phong-ban/2`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409)
      .expect((response) => {
        const body = response.body as WrappedErrorResponse;

        expect(body.success).toBe(false);
        expect(body.message).toContain(
          'Không thể xóa phòng ban đang có nhân viên hoặc thiết bị liên kết',
        );
      });
  });

  it('deletes an unlinked department', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .delete(`/${API_PREFIX}/phong-ban/1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<{ message: string }>;

        expect(body.success).toBe(true);
        expect(body.data).toEqual({
          message: 'Xóa phòng ban thành công',
        });
      });
  });

  it('lists device types with pagination and search', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/loai-thiet-bi?page=1&limit=10&search=laptop`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body =
          response.body as WrappedResponse<LoaiThietBiListResponseDto>;

        expect(body.success).toBe(true);
        expect(body.data.items).toEqual([
          {
            id: 1,
            maLoai: 'LT-LAPTOP',
            tenLoai: 'Laptop',
            ghiChu: 'Thiết bị máy tính xách tay',
          },
        ]);
        expect(body.data.total).toBe(1);
      });
  });

  it('returns device type detail by id', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/loai-thiet-bi/1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<LoaiThietBiDto>;

        expect(body.success).toBe(true);
        expect(body.data).toEqual({
          id: 1,
          maLoai: 'LT-LAPTOP',
          tenLoai: 'Laptop',
          ghiChu: 'Thiết bị máy tính xách tay',
        });
      });
  });

  it('creates and updates a device type', async () => {
    const accessToken = await login(app);

    const createResponse = await request(getHttpServer(app))
      .post(`/${API_PREFIX}/loai-thiet-bi`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        maLoai: 'LT-DESKTOP',
        tenLoai: 'Máy bàn',
        ghiChu: 'Thiết bị máy tính để bàn',
      })
      .expect(201);

    const createdBody = createResponse.body as WrappedResponse<LoaiThietBiDto>;
    expect(createdBody.data).toEqual({
      id: 3,
      maLoai: 'LT-DESKTOP',
      tenLoai: 'Máy bàn',
      ghiChu: 'Thiết bị máy tính để bàn',
    });

    await request(getHttpServer(app))
      .put(`/${API_PREFIX}/loai-thiet-bi/3`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        maLoai: 'LT-PC',
        tenLoai: 'Máy tính để bàn',
        ghiChu: 'Thiết bị văn phòng',
      })
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<LoaiThietBiDto>;

        expect(body.data).toEqual({
          id: 3,
          maLoai: 'LT-PC',
          tenLoai: 'Máy tính để bàn',
          ghiChu: 'Thiết bị văn phòng',
        });
      });
  });

  it('rejects duplicate device-type code', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .post(`/${API_PREFIX}/loai-thiet-bi`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        maLoai: 'LT-LAPTOP',
        tenLoai: 'Laptop mới',
        ghiChu: null,
      })
      .expect(409)
      .expect((response) => {
        const body = response.body as WrappedErrorResponse;

        expect(body.success).toBe(false);
        expect(body.message).toContain('Mã danh mục đã tồn tại');
      });
  });

  it('refuses to delete a linked device type', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .delete(`/${API_PREFIX}/loai-thiet-bi/2`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409)
      .expect((response) => {
        const body = response.body as WrappedErrorResponse;

        expect(body.success).toBe(false);
        expect(body.message).toContain(
          'Không thể xóa loại thiết bị đang có thiết bị liên kết',
        );
      });
  });

  it('deletes an unlinked device type', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .delete(`/${API_PREFIX}/loai-thiet-bi/1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<{ message: string }>;

        expect(body.success).toBe(true);
        expect(body.data).toEqual({
          message: 'Xóa loại thiết bị thành công',
        });
      });
  });

  it('serves Scalar docs and OpenAPI JSON under /v1', async () => {
    await request(getHttpServer(app))
      .get(OPENAPI_JSON_PATH)
      .expect(200)
      .expect((response) => {
        const openApi = response.body as {
          openapi: string;
          paths: Record<
            string,
            {
              get?: {
                parameters?: Array<{ name: string }>;
              };
            }
          >;
        };

        expect(openApi.openapi).toEqual(expect.any(String));
        expect(openApi.paths[`/${API_PREFIX}/auth/login`]).toBeDefined();
        expect(openApi.paths[`/${API_PREFIX}/loai-thiet-bi`]).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/loai-thiet-bi/{id}`],
        ).toBeDefined();
        expect(openApi.paths[`/${API_PREFIX}/phong-ban`]).toBeDefined();
        expect(openApi.paths[`/${API_PREFIX}/phong-ban/{id}`]).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/loai-thiet-bi`].get?.parameters?.map(
            (parameter) => parameter.name,
          ),
        ).toEqual(expect.arrayContaining(['page', 'limit', 'search']));
        expect(
          openApi.paths[`/${API_PREFIX}/phong-ban`].get?.parameters?.map(
            (parameter) => parameter.name,
          ),
        ).toEqual(expect.arrayContaining(['page', 'limit', 'search']));
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

interface WrappedErrorResponse {
  success: boolean;
  data: null;
  message: string;
  statusCode: number;
}
