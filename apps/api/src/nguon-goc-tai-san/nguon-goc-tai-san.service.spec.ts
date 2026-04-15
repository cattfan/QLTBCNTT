import { BadRequestException, ConflictException } from '@nestjs/common';
import type { SupabaseService } from '../database';
import { NguonGocTaiSanService } from './nguon-goc-tai-san.service';

describe('NguonGocTaiSanService', () => {
  const assetOriginRow = {
    id: 1,
    ma_nguon_goc: 'NSNN',
    ten_nguon_goc: 'Ngân sách nhà nước',
    ghi_chu: 'Nguồn kinh phí cấp phát',
  };

  let client: {
    from: jest.Mock;
  };
  let service: NguonGocTaiSanService;

  beforeEach(() => {
    client = {
      from: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn(() => client),
    } as unknown as SupabaseService;

    service = new NguonGocTaiSanService(supabaseService);
  });

  it('reuses BaseCrudService list search for asset origins', async () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [assetOriginRow],
        count: 1,
        error: null,
      }),
    };

    client.from.mockReturnValue(queryBuilder);

    const result = await service.list({
      page: 1,
      limit: 10,
      search: 'ngan sach',
    });

    expect(client.from).toHaveBeenCalledWith('nguon_goc_tai_san');
    expect(queryBuilder.or).toHaveBeenCalledWith(
      'ma_nguon_goc.ilike.%ngan sach%,ten_nguon_goc.ilike.%ngan sach%',
    );
    expect(result).toEqual({
      items: [
        {
          id: 1,
          maNguonGoc: 'NSNN',
          tenNguonGoc: 'Ngân sách nhà nước',
          ghiChu: 'Nguồn kinh phí cấp phát',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('rejects create when asset-origin name is blank', async () => {
    await expect(
      service.createItem({
        maNguonGoc: null,
        tenNguonGoc: '   ',
        ghiChu: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates normalized asset-origin payload through base create', async () => {
    const insertBuilder = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: assetOriginRow,
        error: null,
      }),
    };

    client.from.mockReturnValue(insertBuilder);

    const result = await service.createItem({
      maNguonGoc: ' NSNN ',
      tenNguonGoc: ' Ngân sách nhà nước ',
      ghiChu: ' Nguồn kinh phí cấp phát ',
    });

    expect(insertBuilder.insert).toHaveBeenCalledWith({
      ma_nguon_goc: 'NSNN',
      ten_nguon_goc: 'Ngân sách nhà nước',
      ghi_chu: 'Nguồn kinh phí cấp phát',
    });
    expect(result).toEqual({
      id: 1,
      maNguonGoc: 'NSNN',
      tenNguonGoc: 'Ngân sách nhà nước',
      ghiChu: 'Nguồn kinh phí cấp phát',
    });
  });

  it('refuses to delete when devices are linked', async () => {
    const countBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        count: 1,
        error: null,
      }),
    };

    client.from.mockReturnValue(countBuilder);

    await expect(service.removeItem(1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
