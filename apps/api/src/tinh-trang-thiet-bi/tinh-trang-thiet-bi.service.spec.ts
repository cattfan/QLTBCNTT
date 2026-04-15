import { BadRequestException, ConflictException } from '@nestjs/common';
import type { SupabaseService } from '../database';
import { TinhTrangThietBiService } from './tinh-trang-thiet-bi.service';

describe('TinhTrangThietBiService', () => {
  const statusRow = {
    id: 1,
    ma_tinh_trang: 'DANG_SU_DUNG',
    ten_tinh_trang: 'Đang sử dụng',
    ghi_chu: null,
  };

  let client: {
    from: jest.Mock;
  };
  let service: TinhTrangThietBiService;

  beforeEach(() => {
    client = {
      from: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn(() => client),
    } as unknown as SupabaseService;

    service = new TinhTrangThietBiService(supabaseService);
  });

  it('ensures default statuses and returns paginated list', async () => {
    const listBuilder = {
      select: jest
        .fn()
        .mockResolvedValueOnce({
          data: [],
          error: null,
        })
        .mockReturnThis(),
      insert: jest.fn().mockResolvedValue({
        error: null,
      }),
      or: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [statusRow],
        count: 1,
        error: null,
      }),
    };

    client.from.mockReturnValue(listBuilder);

    const result = await service.list({
      page: 1,
      limit: 10,
      search: 'su dung',
    });

    expect(client.from).toHaveBeenCalledWith('tinh_trang_thiet_bi');
    expect(listBuilder.insert).toHaveBeenCalled();
    expect(result).toEqual({
      items: [
        {
          id: 1,
          maTinhTrang: 'DANG_SU_DUNG',
          tenTinhTrang: 'Đang sử dụng',
          ghiChu: null,
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('rejects create when status name is blank', async () => {
    client.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      insert: jest.fn().mockResolvedValue({
        error: null,
      }),
    });

    await expect(
      service.createItem({
        maTinhTrang: null,
        tenTinhTrang: '   ',
        ghiChu: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses to delete when devices are linked', async () => {
    const defaultsBuilder = {
      select: jest.fn().mockResolvedValue({
        data: [
          { ma_tinh_trang: 'DANG_SU_DUNG' },
          { ma_tinh_trang: 'LUU_KHO' },
          { ma_tinh_trang: 'THANH_LY' },
        ],
        error: null,
      }),
    };
    const countBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        count: 1,
        error: null,
      }),
    };

    client.from
      .mockReturnValueOnce(defaultsBuilder)
      .mockReturnValueOnce(countBuilder);

    await expect(service.removeItem(1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
