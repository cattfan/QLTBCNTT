import { BadRequestException, ConflictException } from '@nestjs/common';
import type { SupabaseService } from '../database';
import { PhanMemDietVirusService } from './phan-mem-diet-virus.service';

describe('PhanMemDietVirusService', () => {
  const softwareRow = {
    id: 1,
    ten_phan_mem: 'Kaspersky',
    phien_ban: '2026',
  };

  let client: {
    from: jest.Mock;
  };
  let service: PhanMemDietVirusService;

  beforeEach(() => {
    client = {
      from: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn(() => client),
    } as unknown as SupabaseService;

    service = new PhanMemDietVirusService(supabaseService);
  });

  it('reuses BaseCrudService list search for antivirus software', async () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [softwareRow],
        count: 1,
        error: null,
      }),
    };

    client.from.mockReturnValue(queryBuilder);

    const result = await service.list({
      page: 1,
      limit: 10,
      search: 'Kaspersky',
    });

    expect(client.from).toHaveBeenCalledWith('phan_mem_diet_virus');
    expect(queryBuilder.or).toHaveBeenCalledWith(
      'ten_phan_mem.ilike.%Kaspersky%',
    );
    expect(result).toEqual({
      items: [
        {
          id: 1,
          tenPhanMem: 'Kaspersky',
          phienBan: '2026',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('rejects create when software name is blank', async () => {
    await expect(
      service.createItem({
        tenPhanMem: '   ',
        phienBan: '2026',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates normalized antivirus payload through base create', async () => {
    const insertBuilder = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: softwareRow,
        error: null,
      }),
    };

    client.from.mockReturnValue(insertBuilder);

    const result = await service.createItem({
      tenPhanMem: ' Kaspersky ',
      phienBan: ' 2026 ',
    });

    expect(insertBuilder.insert).toHaveBeenCalledWith({
      ten_phan_mem: 'Kaspersky',
      phien_ban: '2026',
    });
    expect(result).toEqual({
      id: 1,
      tenPhanMem: 'Kaspersky',
      phienBan: '2026',
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
