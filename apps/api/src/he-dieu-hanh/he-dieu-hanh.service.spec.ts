import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { SupabaseService } from '../database';
import { HeDieuHanhService } from './he-dieu-hanh.service';

describe('HeDieuHanhService', () => {
  const operatingSystemRow = {
    id: 1,
    ten_he_dieu_hanh: 'Windows',
    phien_ban: '11 Pro',
  };

  let client: {
    from: jest.Mock;
  };
  let service: HeDieuHanhService;

  beforeEach(() => {
    client = {
      from: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn(() => client),
    } as unknown as SupabaseService;

    service = new HeDieuHanhService(supabaseService);
  });

  it('returns paginated operating systems and applies name search', async () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [operatingSystemRow],
        count: 1,
        error: null,
      }),
    };

    client.from.mockReturnValue(queryBuilder);

    const result = await service.findAll({
      page: 1,
      limit: 10,
      search: 'Windows',
    });

    expect(client.from).toHaveBeenCalledWith('he_dieu_hanh');
    expect(queryBuilder.ilike).toHaveBeenCalledWith(
      'ten_he_dieu_hanh',
      '%Windows%',
    );
    expect(result).toEqual({
      items: [
        {
          id: 1,
          tenHeDieuHanh: 'Windows',
          phienBan: '11 Pro',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('rejects create when operating-system name is blank', async () => {
    await expect(
      service.create({
        tenHeDieuHanh: '   ',
        phienBan: '11 Pro',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns detail by id', async () => {
    const findBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: operatingSystemRow,
        error: null,
      }),
    };

    client.from.mockReturnValue(findBuilder);

    await expect(service.findById(1)).resolves.toEqual({
      id: 1,
      tenHeDieuHanh: 'Windows',
      phienBan: '11 Pro',
    });
  });

  it('throws not found when operating system does not exist', async () => {
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

  it('refuses to delete when devices are linked through configuration', async () => {
    const existsBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: operatingSystemRow,
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
      .mockReturnValueOnce(existsBuilder)
      .mockReturnValueOnce(countBuilder);

    await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
  });
});
