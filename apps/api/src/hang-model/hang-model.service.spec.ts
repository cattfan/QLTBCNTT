import { BadRequestException, ConflictException } from '@nestjs/common';
import type { SupabaseService } from '../database';
import { HangModelService } from './hang-model.service';

describe('HangModelService', () => {
  const hangModelRow = {
    id: 1,
    ten_hang: 'Dell',
    ten_model: 'Latitude 7420',
    ghi_chu: 'Dòng laptop doanh nghiệp',
  };

  let client: {
    from: jest.Mock;
  };
  let service: HangModelService;

  beforeEach(() => {
    client = {
      from: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn(() => client),
    } as unknown as SupabaseService;

    service = new HangModelService(supabaseService);
  });

  it('reuses BaseCrudService list search for brand and model', async () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [hangModelRow],
        count: 1,
        error: null,
      }),
    };

    client.from.mockReturnValue(queryBuilder);

    const result = await service.list({
      page: 1,
      limit: 10,
      search: 'Dell',
    });

    expect(client.from).toHaveBeenCalledWith('hang_model');
    expect(queryBuilder.or).toHaveBeenCalledWith(
      'ten_hang.ilike.%Dell%,ten_model.ilike.%Dell%',
    );
    expect(result).toEqual({
      items: [
        {
          id: 1,
          tenHang: 'Dell',
          tenModel: 'Latitude 7420',
          ghiChu: 'Dòng laptop doanh nghiệp',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('rejects create when brand name is blank', async () => {
    await expect(
      service.createItem({
        tenHang: '   ',
        tenModel: 'Latitude 7420',
        ghiChu: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates normalized hang-model payload through base create', async () => {
    const insertBuilder = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: hangModelRow,
        error: null,
      }),
    };

    client.from.mockReturnValue(insertBuilder);

    const result = await service.createItem({
      tenHang: ' Dell ',
      tenModel: ' Latitude 7420 ',
      ghiChu: ' Dòng laptop doanh nghiệp ',
    });

    expect(insertBuilder.insert).toHaveBeenCalledWith({
      ten_hang: 'Dell',
      ten_model: 'Latitude 7420',
      ghi_chu: 'Dòng laptop doanh nghiệp',
    });
    expect(result).toEqual({
      id: 1,
      tenHang: 'Dell',
      tenModel: 'Latitude 7420',
      ghiChu: 'Dòng laptop doanh nghiệp',
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
