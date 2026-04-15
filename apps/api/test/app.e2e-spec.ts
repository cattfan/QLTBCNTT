import {
  ConflictException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import type {
  CreatePhongBanDto,
  CreateHangModelDto,
  CreateHeDieuHanhDto,
  CreateLoaiThietBiDto,
  CreatePhanMemDietVirusDto,
  CreateTinhTrangThietBiDto,
  HangModelDto,
  HangModelListResponseDto,
  HangModelQueryDto,
  HeDieuHanhDto,
  HeDieuHanhListResponseDto,
  HeDieuHanhQueryDto,
  LoaiThietBiDto,
  LoaiThietBiListResponseDto,
  LoaiThietBiQueryDto,
  LoginResponseDto,
  PhanMemDietVirusDto,
  PhanMemDietVirusListResponseDto,
  PhanMemDietVirusQueryDto,
  PhongBanDto,
  PhongBanListResponseDto,
  PhongBanQueryDto,
  TinhTrangThietBiDto,
  TinhTrangThietBiListResponseDto,
  TinhTrangThietBiQueryDto,
  UpdateHangModelDto,
  UpdateHeDieuHanhDto,
  UpdateLoaiThietBiDto,
  UpdatePhanMemDietVirusDto,
  UpdatePhongBanDto,
  UpdateTinhTrangThietBiDto,
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
import { HeDieuHanhService } from './../src/he-dieu-hanh/he-dieu-hanh.service';
import { HangModelService } from './../src/hang-model/hang-model.service';
import { LoaiThietBiService } from './../src/loai-thiet-bi/loai-thiet-bi.service';
import { PhanMemDietVirusService } from './../src/phan-mem-diet-virus/phan-mem-diet-virus.service';
import { PhongBanService } from './../src/phong-ban/phong-ban.service';
import { TinhTrangThietBiService } from './../src/tinh-trang-thiet-bi/tinh-trang-thiet-bi.service';

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

class InMemoryHangModelService {
  private readonly linkedHangModelIds = new Set<number>([2]);

  constructor(private readonly hangModels: HangModelDto[]) {}

  list(query: HangModelQueryDto): Promise<HangModelListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim().toLowerCase();

    const filteredItems = search
      ? this.hangModels.filter(
          (item) =>
            item.tenHang.toLowerCase().includes(search) ||
            item.tenModel?.toLowerCase().includes(search),
        )
      : [...this.hangModels];

    const offset = (page - 1) * limit;
    const items = filteredItems.slice(offset, offset + limit);
    const total = filteredItems.length;

    return Promise.resolve({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  getById(id: number): Promise<HangModelDto> {
    const item = this.hangModels.find((current) => current.id === id);

    if (!item) {
      throw new NotFoundException('Không tìm thấy hãng/model');
    }

    return Promise.resolve(item);
  }

  createItem(payload: CreateHangModelDto): Promise<HangModelDto> {
    const tenHang = payload.tenHang.trim();

    if (!tenHang) {
      throw new ConflictException('Tên hãng không được để trống');
    }

    const nextItem: HangModelDto = {
      id: Math.max(...this.hangModels.map((current) => current.id)) + 1,
      tenHang,
      tenModel: payload.tenModel?.trim() || null,
      ghiChu: payload.ghiChu?.trim() || null,
    };

    this.hangModels.push(nextItem);
    return Promise.resolve(nextItem);
  }

  updateItem(id: number, payload: UpdateHangModelDto): Promise<HangModelDto> {
    const item = this.hangModels.find((current) => current.id === id);

    if (!item) {
      throw new NotFoundException('Không tìm thấy hãng/model');
    }

    const tenHang = payload.tenHang.trim();

    if (!tenHang) {
      throw new ConflictException('Tên hãng không được để trống');
    }

    item.tenHang = tenHang;
    item.tenModel = payload.tenModel?.trim() || null;
    item.ghiChu = payload.ghiChu?.trim() || null;

    return Promise.resolve(item);
  }

  removeItem(id: number): Promise<{ message: string }> {
    const index = this.hangModels.findIndex((current) => current.id === id);

    if (index < 0) {
      throw new NotFoundException('Không tìm thấy hãng/model');
    }

    if (this.linkedHangModelIds.has(id)) {
      throw new ConflictException(
        'Không thể xóa hãng/model đang có thiết bị liên kết',
      );
    }

    this.hangModels.splice(index, 1);

    return Promise.resolve({
      message: 'Xóa hãng/model thành công',
    });
  }
}

class InMemoryHeDieuHanhService {
  private readonly linkedOperatingSystemIds = new Set<number>([2]);

  constructor(private readonly operatingSystems: HeDieuHanhDto[]) {}

  findAll(query: HeDieuHanhQueryDto): Promise<HeDieuHanhListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim().toLowerCase();

    const filteredItems = search
      ? this.operatingSystems.filter((item) =>
          item.tenHeDieuHanh.toLowerCase().includes(search),
        )
      : [...this.operatingSystems];

    const offset = (page - 1) * limit;
    const items = filteredItems.slice(offset, offset + limit);
    const total = filteredItems.length;

    return Promise.resolve({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  findById(id: number): Promise<HeDieuHanhDto> {
    const item = this.operatingSystems.find((current) => current.id === id);

    if (!item) {
      throw new NotFoundException('Khong tim thay he dieu hanh');
    }

    return Promise.resolve(item);
  }

  create(payload: CreateHeDieuHanhDto): Promise<HeDieuHanhDto> {
    const tenHeDieuHanh = payload.tenHeDieuHanh.trim();

    if (!tenHeDieuHanh) {
      throw new ConflictException('Ten he dieu hanh khong duoc de trong');
    }

    const nextItem: HeDieuHanhDto = {
      id: Math.max(...this.operatingSystems.map((current) => current.id)) + 1,
      tenHeDieuHanh,
      phienBan: payload.phienBan?.trim() || null,
    };

    this.operatingSystems.push(nextItem);
    return Promise.resolve(nextItem);
  }

  update(id: number, payload: UpdateHeDieuHanhDto): Promise<HeDieuHanhDto> {
    const item = this.operatingSystems.find((current) => current.id === id);

    if (!item) {
      throw new NotFoundException('Khong tim thay he dieu hanh');
    }

    const tenHeDieuHanh = payload.tenHeDieuHanh.trim();

    if (!tenHeDieuHanh) {
      throw new ConflictException('Ten he dieu hanh khong duoc de trong');
    }

    item.tenHeDieuHanh = tenHeDieuHanh;
    item.phienBan = payload.phienBan?.trim() || null;

    return Promise.resolve(item);
  }

  remove(id: number): Promise<{ message: string }> {
    const index = this.operatingSystems.findIndex(
      (current) => current.id === id,
    );

    if (index < 0) {
      throw new NotFoundException('Khong tim thay he dieu hanh');
    }

    if (this.linkedOperatingSystemIds.has(id)) {
      throw new ConflictException(
        'Khong the xoa he dieu hanh dang co thiet bi lien ket',
      );
    }

    this.operatingSystems.splice(index, 1);

    return Promise.resolve({
      message: 'Xoa he dieu hanh thanh cong',
    });
  }
}

class InMemoryPhanMemDietVirusService {
  private readonly linkedSoftwareIds = new Set<number>([2]);

  constructor(private readonly softwares: PhanMemDietVirusDto[]) {}

  list(
    query: PhanMemDietVirusQueryDto,
  ): Promise<PhanMemDietVirusListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim().toLowerCase();

    const filteredItems = search
      ? this.softwares.filter((item) =>
          item.tenPhanMem.toLowerCase().includes(search),
        )
      : [...this.softwares];

    const offset = (page - 1) * limit;
    const items = filteredItems.slice(offset, offset + limit);
    const total = filteredItems.length;

    return Promise.resolve({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  getById(id: number): Promise<PhanMemDietVirusDto> {
    const item = this.softwares.find((current) => current.id === id);

    if (!item) {
      throw new NotFoundException('Khong tim thay phan mem diet virus');
    }

    return Promise.resolve(item);
  }

  createItem(payload: CreatePhanMemDietVirusDto): Promise<PhanMemDietVirusDto> {
    const tenPhanMem = payload.tenPhanMem.trim();

    if (!tenPhanMem) {
      throw new ConflictException(
        'Ten phan mem diet virus khong duoc de trong',
      );
    }

    const nextItem: PhanMemDietVirusDto = {
      id: Math.max(...this.softwares.map((current) => current.id)) + 1,
      tenPhanMem,
      phienBan: payload.phienBan?.trim() || null,
    };

    this.softwares.push(nextItem);
    return Promise.resolve(nextItem);
  }

  updateItem(
    id: number,
    payload: UpdatePhanMemDietVirusDto,
  ): Promise<PhanMemDietVirusDto> {
    const item = this.softwares.find((current) => current.id === id);

    if (!item) {
      throw new NotFoundException('Khong tim thay phan mem diet virus');
    }

    const tenPhanMem = payload.tenPhanMem.trim();

    if (!tenPhanMem) {
      throw new ConflictException(
        'Ten phan mem diet virus khong duoc de trong',
      );
    }

    item.tenPhanMem = tenPhanMem;
    item.phienBan = payload.phienBan?.trim() || null;

    return Promise.resolve(item);
  }

  removeItem(id: number): Promise<{ message: string }> {
    const index = this.softwares.findIndex((current) => current.id === id);

    if (index < 0) {
      throw new NotFoundException('Khong tim thay phan mem diet virus');
    }

    if (this.linkedSoftwareIds.has(id)) {
      throw new ConflictException(
        'Khong the xoa phan mem diet virus dang co thiet bi lien ket',
      );
    }

    this.softwares.splice(index, 1);

    return Promise.resolve({
      message: 'Xoa phan mem diet virus thanh cong',
    });
  }
}

class InMemoryTinhTrangThietBiService {
  private readonly linkedStatusIds = new Set<number>([2]);

  constructor(private readonly statuses: TinhTrangThietBiDto[]) {}

  list(
    query: TinhTrangThietBiQueryDto,
  ): Promise<TinhTrangThietBiListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim().toLowerCase();

    const filteredItems = search
      ? this.statuses.filter((item) =>
          item.tenTinhTrang.toLowerCase().includes(search),
        )
      : [...this.statuses];

    const offset = (page - 1) * limit;
    const items = filteredItems.slice(offset, offset + limit);
    const total = filteredItems.length;

    return Promise.resolve({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  getById(id: number): Promise<TinhTrangThietBiDto> {
    const item = this.statuses.find((current) => current.id === id);

    if (!item) {
      throw new NotFoundException('Khong tim thay tinh trang thiet bi');
    }

    return Promise.resolve(item);
  }

  createItem(payload: CreateTinhTrangThietBiDto): Promise<TinhTrangThietBiDto> {
    const tenTinhTrang = payload.tenTinhTrang.trim();

    if (!tenTinhTrang) {
      throw new ConflictException(
        'Ten tinh trang thiet bi khong duoc de trong',
      );
    }

    const nextItem: TinhTrangThietBiDto = {
      id: Math.max(...this.statuses.map((current) => current.id)) + 1,
      maTinhTrang: payload.maTinhTrang?.trim() || null,
      tenTinhTrang,
      ghiChu: payload.ghiChu?.trim() || null,
    };

    this.statuses.push(nextItem);
    return Promise.resolve(nextItem);
  }

  updateItem(
    id: number,
    payload: UpdateTinhTrangThietBiDto,
  ): Promise<TinhTrangThietBiDto> {
    const item = this.statuses.find((current) => current.id === id);

    if (!item) {
      throw new NotFoundException('Khong tim thay tinh trang thiet bi');
    }

    const tenTinhTrang = payload.tenTinhTrang.trim();

    if (!tenTinhTrang) {
      throw new ConflictException(
        'Ten tinh trang thiet bi khong duoc de trong',
      );
    }

    item.maTinhTrang = payload.maTinhTrang?.trim() || null;
    item.tenTinhTrang = tenTinhTrang;
    item.ghiChu = payload.ghiChu?.trim() || null;

    return Promise.resolve(item);
  }

  removeItem(id: number): Promise<{ message: string }> {
    const index = this.statuses.findIndex((current) => current.id === id);

    if (index < 0) {
      throw new NotFoundException('Khong tim thay tinh trang thiet bi');
    }

    if (this.linkedStatusIds.has(id)) {
      throw new ConflictException(
        'Khong the xoa tinh trang thiet bi dang co thiet bi lien ket',
      );
    }

    this.statuses.splice(index, 1);

    return Promise.resolve({
      message: 'Xoa tinh trang thiet bi thanh cong',
    });
  }
}

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let heDieuHanhService: InMemoryHeDieuHanhService;
  let hangModelService: InMemoryHangModelService;
  let phanMemDietVirusService: InMemoryPhanMemDietVirusService;
  let tinhTrangThietBiService: InMemoryTinhTrangThietBiService;
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
    hangModelService = new InMemoryHangModelService([
      {
        id: 1,
        tenHang: 'Dell',
        tenModel: 'Latitude 7420',
        ghiChu: 'Dòng laptop doanh nghiệp',
      },
      {
        id: 2,
        tenHang: 'HP',
        tenModel: 'LaserJet Pro',
        ghiChu: null,
      },
    ]);
    heDieuHanhService = new InMemoryHeDieuHanhService([
      {
        id: 1,
        tenHeDieuHanh: 'Windows',
        phienBan: '11 Pro',
      },
      {
        id: 2,
        tenHeDieuHanh: 'Ubuntu',
        phienBan: '24.04 LTS',
      },
    ]);
    phanMemDietVirusService = new InMemoryPhanMemDietVirusService([
      {
        id: 1,
        tenPhanMem: 'Kaspersky',
        phienBan: '2026',
      },
      {
        id: 2,
        tenPhanMem: 'Windows Defender',
        phienBan: null,
      },
    ]);
    tinhTrangThietBiService = new InMemoryTinhTrangThietBiService([
      {
        id: 1,
        maTinhTrang: 'DANG_SU_DUNG',
        tenTinhTrang: 'Đang sử dụng',
        ghiChu: null,
      },
      {
        id: 2,
        maTinhTrang: 'LUU_KHO',
        tenTinhTrang: 'Lưu kho',
        ghiChu: null,
      },
      {
        id: 3,
        maTinhTrang: 'THANH_LY',
        tenTinhTrang: 'Thanh lý',
        ghiChu: null,
      },
    ]);

    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    moduleBuilder
      .overrideProvider(HeDieuHanhService)
      .useValue(heDieuHanhService);
    moduleBuilder.overrideProvider(HangModelService).useValue(hangModelService);
    moduleBuilder
      .overrideProvider(LoaiThietBiService)
      .useValue(loaiThietBiService);
    moduleBuilder
      .overrideProvider(PhanMemDietVirusService)
      .useValue(phanMemDietVirusService);
    moduleBuilder
      .overrideProvider(TinhTrangThietBiService)
      .useValue(tinhTrangThietBiService);
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

  it('lists hang-model items with pagination and search', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/hang-model?page=1&limit=10&search=dell`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<HangModelListResponseDto>;

        expect(body.success).toBe(true);
        expect(body.data.items).toEqual([
          {
            id: 1,
            tenHang: 'Dell',
            tenModel: 'Latitude 7420',
            ghiChu: 'Dòng laptop doanh nghiệp',
          },
        ]);
        expect(body.data.total).toBe(1);
      });
  });

  it('returns hang-model detail by id', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/hang-model/1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<HangModelDto>;

        expect(body.success).toBe(true);
        expect(body.data).toEqual({
          id: 1,
          tenHang: 'Dell',
          tenModel: 'Latitude 7420',
          ghiChu: 'Dòng laptop doanh nghiệp',
        });
      });
  });

  it('creates and updates a hang-model item', async () => {
    const accessToken = await login(app);

    const createResponse = await request(getHttpServer(app))
      .post(`/${API_PREFIX}/hang-model`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tenHang: 'Lenovo',
        tenModel: 'ThinkPad X1',
        ghiChu: 'Dòng ultrabook doanh nghiệp',
      })
      .expect(201);

    const createdBody = createResponse.body as WrappedResponse<HangModelDto>;
    expect(createdBody.data).toEqual({
      id: 3,
      tenHang: 'Lenovo',
      tenModel: 'ThinkPad X1',
      ghiChu: 'Dòng ultrabook doanh nghiệp',
    });

    await request(getHttpServer(app))
      .put(`/${API_PREFIX}/hang-model/3`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tenHang: 'Lenovo',
        tenModel: 'ThinkPad X1 Carbon',
        ghiChu: 'Bản nâng cấp',
      })
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<HangModelDto>;

        expect(body.data).toEqual({
          id: 3,
          tenHang: 'Lenovo',
          tenModel: 'ThinkPad X1 Carbon',
          ghiChu: 'Bản nâng cấp',
        });
      });
  });

  it('refuses to delete a linked hang-model item', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .delete(`/${API_PREFIX}/hang-model/2`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409)
      .expect((response) => {
        const body = response.body as WrappedErrorResponse;

        expect(body.success).toBe(false);
        expect(body.message).toContain(
          'Không thể xóa hãng/model đang có thiết bị liên kết',
        );
      });
  });

  it('deletes an unlinked hang-model item', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .delete(`/${API_PREFIX}/hang-model/1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<{ message: string }>;

        expect(body.success).toBe(true);
        expect(body.data).toEqual({
          message: 'Xóa hãng/model thành công',
        });
      });
  });

  it('lists operating systems with pagination and name search', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/he-dieu-hanh?page=1&limit=10&search=windows`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body =
          response.body as WrappedResponse<HeDieuHanhListResponseDto>;

        expect(body.success).toBe(true);
        expect(body.data.items).toEqual([
          {
            id: 1,
            tenHeDieuHanh: 'Windows',
            phienBan: '11 Pro',
          },
        ]);
        expect(body.data.total).toBe(1);
      });
  });

  it('returns operating-system detail by id', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/he-dieu-hanh/1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<HeDieuHanhDto>;

        expect(body.success).toBe(true);
        expect(body.data).toEqual({
          id: 1,
          tenHeDieuHanh: 'Windows',
          phienBan: '11 Pro',
        });
      });
  });

  it('creates and updates an operating system', async () => {
    const accessToken = await login(app);

    const createResponse = await request(getHttpServer(app))
      .post(`/${API_PREFIX}/he-dieu-hanh`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tenHeDieuHanh: 'macOS',
        phienBan: 'Sonoma',
      })
      .expect(201);

    const createdBody = createResponse.body as WrappedResponse<HeDieuHanhDto>;
    expect(createdBody.data).toEqual({
      id: 3,
      tenHeDieuHanh: 'macOS',
      phienBan: 'Sonoma',
    });

    await request(getHttpServer(app))
      .put(`/${API_PREFIX}/he-dieu-hanh/3`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tenHeDieuHanh: 'macOS',
        phienBan: 'Sequoia',
      })
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<HeDieuHanhDto>;

        expect(body.data).toEqual({
          id: 3,
          tenHeDieuHanh: 'macOS',
          phienBan: 'Sequoia',
        });
      });
  });

  it('refuses to delete a linked operating system', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .delete(`/${API_PREFIX}/he-dieu-hanh/2`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409)
      .expect((response) => {
        const body = response.body as WrappedErrorResponse;

        expect(body.success).toBe(false);
        expect(body.message).toContain(
          'Khong the xoa he dieu hanh dang co thiet bi lien ket',
        );
      });
  });

  it('deletes an unlinked operating system', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .delete(`/${API_PREFIX}/he-dieu-hanh/1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<{ message: string }>;

        expect(body.success).toBe(true);
        expect(body.data).toEqual({
          message: 'Xoa he dieu hanh thanh cong',
        });
      });
  });

  it('lists antivirus software with pagination and name search', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(
        `/${API_PREFIX}/phan-mem-diet-virus?page=1&limit=10&search=kaspersky`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body =
          response.body as WrappedResponse<PhanMemDietVirusListResponseDto>;

        expect(body.success).toBe(true);
        expect(body.data.items).toEqual([
          {
            id: 1,
            tenPhanMem: 'Kaspersky',
            phienBan: '2026',
          },
        ]);
        expect(body.data.total).toBe(1);
      });
  });

  it('returns antivirus software detail by id', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/phan-mem-diet-virus/1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<PhanMemDietVirusDto>;

        expect(body.success).toBe(true);
        expect(body.data).toEqual({
          id: 1,
          tenPhanMem: 'Kaspersky',
          phienBan: '2026',
        });
      });
  });

  it('creates and updates antivirus software', async () => {
    const accessToken = await login(app);

    const createResponse = await request(getHttpServer(app))
      .post(`/${API_PREFIX}/phan-mem-diet-virus`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tenPhanMem: 'BKAV',
        phienBan: 'Pro',
      })
      .expect(201);

    const createdBody =
      createResponse.body as WrappedResponse<PhanMemDietVirusDto>;
    expect(createdBody.data).toEqual({
      id: 3,
      tenPhanMem: 'BKAV',
      phienBan: 'Pro',
    });

    await request(getHttpServer(app))
      .put(`/${API_PREFIX}/phan-mem-diet-virus/3`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tenPhanMem: 'BKAV',
        phienBan: 'Enterprise',
      })
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<PhanMemDietVirusDto>;

        expect(body.data).toEqual({
          id: 3,
          tenPhanMem: 'BKAV',
          phienBan: 'Enterprise',
        });
      });
  });

  it('refuses to delete linked antivirus software', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .delete(`/${API_PREFIX}/phan-mem-diet-virus/2`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409)
      .expect((response) => {
        const body = response.body as WrappedErrorResponse;

        expect(body.success).toBe(false);
        expect(body.message).toContain(
          'Khong the xoa phan mem diet virus dang co thiet bi lien ket',
        );
      });
  });

  it('deletes unlinked antivirus software', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .delete(`/${API_PREFIX}/phan-mem-diet-virus/1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<{ message: string }>;

        expect(body.success).toBe(true);
        expect(body.data).toEqual({
          message: 'Xoa phan mem diet virus thanh cong',
        });
      });
  });

  it('lists device statuses with default values and search', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/tinh-trang-thiet-bi?page=1&limit=10&search=Đang`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body =
          response.body as WrappedResponse<TinhTrangThietBiListResponseDto>;

        expect(body.success).toBe(true);
        expect(body.data.items).toEqual([
          {
            id: 1,
            maTinhTrang: 'DANG_SU_DUNG',
            tenTinhTrang: 'Đang sử dụng',
            ghiChu: null,
          },
        ]);
        expect(body.data.total).toBe(1);
      });
  });

  it('returns device-status detail by id', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .get(`/${API_PREFIX}/tinh-trang-thiet-bi/1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<TinhTrangThietBiDto>;

        expect(body.success).toBe(true);
        expect(body.data).toEqual({
          id: 1,
          maTinhTrang: 'DANG_SU_DUNG',
          tenTinhTrang: 'Đang sử dụng',
          ghiChu: null,
        });
      });
  });

  it('creates and updates a device status', async () => {
    const accessToken = await login(app);

    const createResponse = await request(getHttpServer(app))
      .post(`/${API_PREFIX}/tinh-trang-thiet-bi`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        maTinhTrang: 'BAO_TRI',
        tenTinhTrang: 'Bảo trì',
        ghiChu: 'Thiết bị đang bảo trì',
      })
      .expect(201);

    const createdBody =
      createResponse.body as WrappedResponse<TinhTrangThietBiDto>;
    expect(createdBody.data).toEqual({
      id: 4,
      maTinhTrang: 'BAO_TRI',
      tenTinhTrang: 'Bảo trì',
      ghiChu: 'Thiết bị đang bảo trì',
    });

    await request(getHttpServer(app))
      .put(`/${API_PREFIX}/tinh-trang-thiet-bi/4`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        maTinhTrang: 'BAO_TRI',
        tenTinhTrang: 'Bảo trì định kỳ',
        ghiChu: 'Thiết bị bảo trì theo kế hoạch',
      })
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<TinhTrangThietBiDto>;

        expect(body.data).toEqual({
          id: 4,
          maTinhTrang: 'BAO_TRI',
          tenTinhTrang: 'Bảo trì định kỳ',
          ghiChu: 'Thiết bị bảo trì theo kế hoạch',
        });
      });
  });

  it('refuses to delete a linked device status', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .delete(`/${API_PREFIX}/tinh-trang-thiet-bi/2`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409)
      .expect((response) => {
        const body = response.body as WrappedErrorResponse;

        expect(body.success).toBe(false);
        expect(body.message).toContain(
          'Khong the xoa tinh trang thiet bi dang co thiet bi lien ket',
        );
      });
  });

  it('deletes an unlinked device status', async () => {
    const accessToken = await login(app);

    await request(getHttpServer(app))
      .delete(`/${API_PREFIX}/tinh-trang-thiet-bi/1`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as WrappedResponse<{ message: string }>;

        expect(body.success).toBe(true);
        expect(body.data).toEqual({
          message: 'Xoa tinh trang thiet bi thanh cong',
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
        expect(
          openApi.paths[`/${API_PREFIX}/phan-mem-diet-virus`],
        ).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/phan-mem-diet-virus/{id}`],
        ).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/tinh-trang-thiet-bi`],
        ).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/tinh-trang-thiet-bi/{id}`],
        ).toBeDefined();
        expect(openApi.paths[`/${API_PREFIX}/he-dieu-hanh`]).toBeDefined();
        expect(openApi.paths[`/${API_PREFIX}/he-dieu-hanh/{id}`]).toBeDefined();
        expect(openApi.paths[`/${API_PREFIX}/hang-model`]).toBeDefined();
        expect(openApi.paths[`/${API_PREFIX}/hang-model/{id}`]).toBeDefined();
        expect(openApi.paths[`/${API_PREFIX}/loai-thiet-bi`]).toBeDefined();
        expect(
          openApi.paths[`/${API_PREFIX}/loai-thiet-bi/{id}`],
        ).toBeDefined();
        expect(openApi.paths[`/${API_PREFIX}/phong-ban`]).toBeDefined();
        expect(openApi.paths[`/${API_PREFIX}/phong-ban/{id}`]).toBeDefined();
        expect(
          openApi.paths[
            `/${API_PREFIX}/phan-mem-diet-virus`
          ].get?.parameters?.map((parameter) => parameter.name),
        ).toEqual(expect.arrayContaining(['page', 'limit', 'search']));
        expect(
          openApi.paths[
            `/${API_PREFIX}/tinh-trang-thiet-bi`
          ].get?.parameters?.map((parameter) => parameter.name),
        ).toEqual(expect.arrayContaining(['page', 'limit', 'search']));
        expect(
          openApi.paths[`/${API_PREFIX}/he-dieu-hanh`].get?.parameters?.map(
            (parameter) => parameter.name,
          ),
        ).toEqual(expect.arrayContaining(['page', 'limit', 'search']));
        expect(
          openApi.paths[`/${API_PREFIX}/hang-model`].get?.parameters?.map(
            (parameter) => parameter.name,
          ),
        ).toEqual(expect.arrayContaining(['page', 'limit', 'search']));
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
