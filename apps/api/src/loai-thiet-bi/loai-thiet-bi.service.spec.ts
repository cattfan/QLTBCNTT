import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { SupabaseService } from '../database';
import { LoaiThietBiService } from './loai-thiet-bi.service';

describe('LoaiThietBiService', () => {
  const categoryRow = {
    id: 1,
    ma_loai: 'LT-LAPTOP',
    ten_loai: 'Laptop',
    ghi_chu: 'Thiết bị máy tính xách tay',
  };

  let client: {
    from: jest.Mock;
  };
  let service: LoaiThietBiService;

  beforeEach(() => {
    client = {
      from: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn(() => client),
    } as unknown as SupabaseService;

    service = new LoaiThietBiService(supabaseService);
  });

  it('returns paginated categories and applies name search', async () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [categoryRow],
        count: 1,
        error: null,
      }),
    };

    client.from.mockReturnValue(queryBuilder);

    const result = await service.findAll({
      page: 1,
      limit: 10,
      search: 'Laptop',
    });

    expect(client.from).toHaveBeenCalledWith('loai_thiet_bi');
    expect(queryBuilder.ilike).toHaveBeenCalledWith('ten_loai', '%Laptop%');
    expect(result).toEqual({
      items: [
        {
          id: 1,
          maLoai: 'LT-LAPTOP',
          tenLoai: 'Laptop',
          ghiChu: 'Thiết bị máy tính xách tay',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('rejects create when category code is blank', async () => {
    await expect(
      service.create({
        maLoai: '   ',
        tenLoai: 'Laptop',
        ghiChu: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects create when category code already exists', async () => {
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
        maLoai: 'LT-LAPTOP',
        tenLoai: 'Laptop',
        ghiChu: null,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns detail by id', async () => {
    const findBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: categoryRow,
        error: null,
      }),
    };

    client.from.mockReturnValue(findBuilder);

    await expect(service.findById(1)).resolves.toEqual({
      id: 1,
      maLoai: 'LT-LAPTOP',
      tenLoai: 'Laptop',
      ghiChu: 'Thiết bị máy tính xách tay',
    });
  });

  it('throws not found when category does not exist', async () => {
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

  it('refuses to delete when devices are linked', async () => {
    const existsBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: categoryRow,
        error: null,
      }),
    };
    const deviceCountBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        count: 1,
        error: null,
      }),
    };

    client.from
      .mockReturnValueOnce(existsBuilder)
      .mockReturnValueOnce(deviceCountBuilder);

    await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
  });
});
