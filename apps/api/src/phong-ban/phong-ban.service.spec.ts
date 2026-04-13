import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { SupabaseService } from '../database';
import { PhongBanService } from './phong-ban.service';

describe('PhongBanService', () => {
  const departmentRow = {
    id: 1,
    ma_phong_ban: 'PB-KT',
    ten_phong_ban: 'Phòng Kế toán',
    ghi_chu: 'Theo dõi tài chính',
  };

  let client: {
    from: jest.Mock;
  };
  let service: PhongBanService;

  beforeEach(() => {
    client = {
      from: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn(() => client),
    } as unknown as SupabaseService;

    service = new PhongBanService(supabaseService);
  });

  it('returns paginated departments and applies search', async () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [departmentRow],
        count: 1,
        error: null,
      }),
    };

    client.from.mockReturnValue(queryBuilder);

    const result = await service.findAll({
      page: 1,
      limit: 10,
      search: 'KT',
    });

    expect(client.from).toHaveBeenCalledWith('phong_ban');
    expect(queryBuilder.or).toHaveBeenCalledWith(
      'ma_phong_ban.ilike.%KT%,ten_phong_ban.ilike.%KT%',
    );
    expect(result).toEqual({
      items: [
        {
          id: 1,
          maPhongBan: 'PB-KT',
          tenPhongBan: 'Phòng Kế toán',
          ghiChu: 'Theo dõi tài chính',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('rejects create when department code is blank', async () => {
    await expect(
      service.create({
        maPhongBan: '   ',
        tenPhongBan: 'Phòng Kế toán',
        ghiChu: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects create when department code already exists', async () => {
    const duplicateCheckBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [{ id: 99 }],
        error: null,
      }),
    };

    client.from.mockReturnValueOnce(duplicateCheckBuilder);

    await expect(
      service.create({
        maPhongBan: 'PB-KT',
        tenPhongBan: 'Phòng Kế toán',
        ghiChu: null,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns detail by id', async () => {
    const findBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: departmentRow,
        error: null,
      }),
    };

    client.from.mockReturnValue(findBuilder);

    await expect(service.findById(1)).resolves.toEqual({
      id: 1,
      maPhongBan: 'PB-KT',
      tenPhongBan: 'Phòng Kế toán',
      ghiChu: 'Theo dõi tài chính',
    });
  });

  it('throws not found when department does not exist', async () => {
    const findBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    client.from.mockReturnValue(findBuilder);

    await expect(service.findById(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('refuses to delete when employees are linked', async () => {
    const existsBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: departmentRow,
        error: null,
      }),
    };
    const employeeCountBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        count: 1,
        error: null,
      }),
    };
    const deviceCountBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        count: 0,
        error: null,
      }),
    };

    client.from
      .mockReturnValueOnce(existsBuilder)
      .mockReturnValueOnce(employeeCountBuilder)
      .mockReturnValueOnce(deviceCountBuilder);

    await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
  });
});
