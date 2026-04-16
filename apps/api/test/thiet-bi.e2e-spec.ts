import { ConflictException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import type {
  CreateThietBiDto,
  DeleteThietBiResponseDto,
  LoginResponseDto,
  ThietBiDto,
  ThietBiListResponseDto,
  ThietBiQueryDto,
  UpdateThietBiDto,
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
import { ThietBiService } from './../src/thiet-bi/thiet-bi.service';

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

class InMemoryThietBiService {
  private readonly assignedIds = new Set<number>([2]);
  private readonly repairingIds = new Set<number>([3]);

  constructor(private readonly devices: ThietBiDto[]) {}

  list(query: ThietBiQueryDto): Promise<ThietBiListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim().toLowerCase();

    let filteredItems = [...this.devices];

    if (query.phongBanId !== undefined) {
      filteredItems = filteredItems.filter(
        (item) => item.phongBanId === query.phongBanId,
      );
    }

    if (query.tinhTrangId !== undefined) {
      filteredItems = filteredItems.filter(
        (item) => item.tinhTrangId === query.tinhTrangId,
      );
    }

    if (query.loaiThietBiId !== undefined) {
      filteredItems = filteredItems.filter(
        (item) => item.loaiThietBiId === query.loaiThietBiId,
      );
    }

    if (search) {
      filteredItems = filteredItems.filter(
        (item) =>
          item.maThietBi.toLowerCase().includes(search) ||
          item.tenThietBi.toLowerCase().includes(search) ||
          item.serial?.toLowerCase().includes(search),
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

  getById(id: number): Promise<ThietBiDto> {
    const item = this.devices.find((current) => current.id === id);

    if (!item) {
      throw new ConflictException('Khong tim thay thiet bi');
    }

    return Promise.resolve(item);
  }

  createItem(payload: CreateThietBiDto): Promise<ThietBiDto> {
    const normalizedSerial = payload.serial?.trim() ?? null;

    if (
      normalizedSerial &&
      this.devices.some((item) => item.serial === normalizedSerial)
    ) {
      throw new ConflictException('Serial da ton tai');
    }

    const nextItem: ThietBiDto = {
      id: Math.max(...this.devices.map((current) => current.id)) + 1,
      maThietBi: payload.maThietBi.trim(),
      tenThietBi: payload.tenThietBi.trim(),
      serial: normalizedSerial,
      loaiThietBiId: payload.loaiThietBiId,
      hangModelId: payload.hangModelId ?? null,
      nguonGocId: payload.nguonGocId ?? null,
      phongBanId: payload.phongBanId ?? null,
      nguoiSuDungId: payload.nguoiSuDungId ?? null,
      tinhTrangId: payload.tinhTrangId ?? null,
      namTrangBi: payload.namTrangBi ?? null,
      ngayTiepNhan: payload.ngayTiepNhan ?? null,
      laThietBiDungChung: payload.laThietBiDungChung ?? null,
      thietBiMat: payload.thietBiMat ?? null,
      ghiChu: payload.ghiChu?.trim() || null,
    };

    this.devices.push(nextItem);
    return Promise.resolve(nextItem);
  }

  updateItem(id: number, payload: UpdateThietBiDto): Promise<ThietBiDto> {
    const item = this.devices.find((current) => current.id === id);

    if (!item) {
      throw new ConflictException('Khong tim thay thiet bi');
    }

    const normalizedSerial = payload.serial?.trim() ?? null;

    if (
      normalizedSerial &&
      this.devices.some(
        (current) => current.id !== id && current.serial === normalizedSerial,
      )
    ) {
      throw new ConflictException('Serial da ton tai');
    }

    item.maThietBi = payload.maThietBi.trim();
    item.tenThietBi = payload.tenThietBi.trim();
    item.serial = normalizedSerial;
    item.loaiThietBiId = payload.loaiThietBiId;
    item.hangModelId = payload.hangModelId ?? null;
    item.nguonGocId = payload.nguonGocId ?? null;
    item.phongBanId = payload.phongBanId ?? null;
    item.nguoiSuDungId = payload.nguoiSuDungId ?? null;
    item.tinhTrangId = payload.tinhTrangId ?? null;
    item.namTrangBi = payload.namTrangBi ?? null;
    item.ngayTiepNhan = payload.ngayTiepNhan ?? null;
    item.laThietBiDungChung = payload.laThietBiDungChung ?? null;
    item.thietBiMat = payload.thietBiMat ?? null;
    item.ghiChu = payload.ghiChu?.trim() || null;

    return Promise.resolve(item);
  }

  removeItem(id: number): Promise<DeleteThietBiResponseDto> {
    if (this.assignedIds.has(id)) {
      throw new ConflictException('Khong the xoa thiet bi dang duoc ban giao');
    }

    if (this.repairingIds.has(id)) {
      throw new ConflictException('Khong the xoa thiet bi dang sua chua');
    }

    const index = this.devices.findIndex((current) => current.id === id);

    if (index >= 0) {
      this.devices.splice(index, 1);
    }

    return Promise.resolve({
      message: 'Xoa thiet bi thanh cong',
    });
  }
}

describe('ThietBiController (e2e)', () => {
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

    const thietBiService = new InMemoryThietBiService([
      {
        id: 1,
        maThietBi: 'TB-001',
        tenThietBi: 'Laptop Dell Latitude',
        serial: 'SN-001',
        loaiThietBiId: 1,
        hangModelId: 1,
        nguonGocId: 1,
        phongBanId: 2,
        nguoiSuDungId: 1,
        tinhTrangId: 1,
        namTrangBi: 2025,
        ngayTiepNhan: '2026-04-16',
        laThietBiDungChung: false,
        thietBiMat: false,
        ghiChu: 'May van phong',
      },
      {
        id: 2,
        maThietBi: 'TB-002',
        tenThietBi: 'May in HP',
        serial: 'SN-002',
        loaiThietBiId: 2,
        hangModelId: 2,
        nguonGocId: 2,
        phongBanId: 3,
        nguoiSuDungId: null,
        tinhTrangId: 2,
        namTrangBi: 2024,
        ngayTiepNhan: '2026-04-10',
        laThietBiDungChung: true,
        thietBiMat: false,
        ghiChu: null,
      },
      {
        id: 3,
        maThietBi: 'TB-003',
        tenThietBi: 'Desktop Lenovo',
        serial: 'SN-003',
        loaiThietBiId: 1,
        hangModelId: 3,
        nguonGocId: 1,
        phongBanId: 2,
        nguoiSuDungId: 2,
        tinhTrangId: 3,
        namTrangBi: 2023,
        ngayTiepNhan: '2026-03-01',
        laThietBiDungChung: false,
        thietBiMat: false,
        ghiChu: null,
      },
    ]);

    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    moduleBuilder.overrideProvider(USER_REPOSITORY).useValue(usersRepository);
    moduleBuilder.overrideProvider(ThietBiService).useValue(thietBiService);
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

  it('lists devices with filters and pagination', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(
        `/${API_PREFIX}/thiet-bi?page=1&limit=10&search=dell&phongBanId=2&tinhTrangId=1&loaiThietBiId=1`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<ThietBiListResponseDto>;

        expect(body.data.items).toEqual([
          {
            id: 1,
            maThietBi: 'TB-001',
            tenThietBi: 'Laptop Dell Latitude',
            serial: 'SN-001',
            loaiThietBiId: 1,
            hangModelId: 1,
            nguonGocId: 1,
            phongBanId: 2,
            nguoiSuDungId: 1,
            tinhTrangId: 1,
            namTrangBi: 2025,
            ngayTiepNhan: '2026-04-16',
            laThietBiDungChung: false,
            thietBiMat: false,
            ghiChu: 'May van phong',
          },
        ]);
      });
  });

  it('returns device detail by id', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/thiet-bi/1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<ThietBiDto>;
        expect(body.data.serial).toBe('SN-001');
      });
  });

  it('creates and updates a device with unique serial', async () => {
    const accessToken = await login(app);

    const createResponse = await request(getHttpServer(app))
      .post(`/${API_PREFIX}/thiet-bi`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        maThietBi: 'TB-004',
        tenThietBi: 'MacBook Pro',
        serial: 'SN-004',
        loaiThietBiId: 1,
        hangModelId: 4,
        phongBanId: 2,
      })
      .expect(201);

    const createdBody = createResponse.body as WrappedResponse<ThietBiDto>;
    expect(createdBody.data.serial).toBe('SN-004');

    await request(getHttpServer(app))
      .put(`/${API_PREFIX}/thiet-bi/4`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        maThietBi: 'TB-004',
        tenThietBi: 'MacBook Pro 14',
        serial: 'SN-004',
        loaiThietBiId: 1,
        hangModelId: 4,
        phongBanId: 2,
      })
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<ThietBiDto>;
        expect(body.data.tenThietBi).toBe('MacBook Pro 14');
      });
  });

  it('rejects duplicate serial on create or update', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .post(`/${API_PREFIX}/thiet-bi`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        maThietBi: 'TB-005',
        tenThietBi: 'Laptop HP',
        serial: 'SN-001',
        loaiThietBiId: 1,
      })
      .expect(409);

    await request(getHttpServer(app))
      .put(`/${API_PREFIX}/thiet-bi/3`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        maThietBi: 'TB-003',
        tenThietBi: 'Desktop Lenovo',
        serial: 'SN-001',
        loaiThietBiId: 1,
      })
      .expect(409);
  });

  it('refuses to delete assigned or repairing devices', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .delete(`/${API_PREFIX}/thiet-bi/2`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409);

    await request(getHttpServer(app))
      .delete(`/${API_PREFIX}/thiet-bi/3`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409);
  });

  it('shows device endpoints in Scalar/OpenAPI', async () => {
    await request(getHttpServer(app))
      .get(OPENAPI_JSON_PATH)
      .expect(200)
      .expect((response) => {
        const openApi = response.body as {
          paths: Record<string, unknown>;
        };

        expect(openApi.paths[`/${API_PREFIX}/thiet-bi`]).toBeDefined();
        expect(openApi.paths[`/${API_PREFIX}/thiet-bi/{id}`]).toBeDefined();
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

interface WrappedResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
