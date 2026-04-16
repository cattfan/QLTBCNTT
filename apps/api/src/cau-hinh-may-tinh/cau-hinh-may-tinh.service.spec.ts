import { NotFoundException } from '@nestjs/common';
import type { SupabaseService } from '../database';
import { CauHinhMayTinhService } from './cau-hinh-may-tinh.service';

describe('CauHinhMayTinhService', () => {
  let client: { from: jest.Mock };
  let service: CauHinhMayTinhService;

  beforeEach(() => {
    client = {
      from: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn(() => client),
    } as unknown as SupabaseService;

    service = new CauHinhMayTinhService(supabaseService);
  });

  it('returns device configuration by device id', async () => {
    const deviceBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: 1 },
        error: null,
      }),
    };
    const configBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          thiet_bi_id: 1,
          mainboard: 'Dell 0X123',
          cpu: 'Intel Core i7',
          ram: '16GB',
          o_cung: '512GB SSD',
          he_dieu_hanh_id: 1,
          man_hinh: null,
          phan_mem_diet_virus_id: null,
          ghi_chu: null,
        },
        error: null,
      }),
    };

    client.from
      .mockReturnValueOnce(deviceBuilder)
      .mockReturnValueOnce(configBuilder);

    await expect(service.getByDeviceId(1)).resolves.toEqual({
      id: 1,
      thietBiId: 1,
      mainboard: 'Dell 0X123',
      cpu: 'Intel Core i7',
      ram: '16GB',
      oCung: '512GB SSD',
      heDieuHanhId: 1,
      manHinh: null,
      phanMemDietVirusId: null,
      ghiChu: null,
    });
  });

  it('creates configuration when device has no existing config', async () => {
    const deviceBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: 1 },
        error: null,
      }),
    };
    const configBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };
    const insertBuilder = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          thiet_bi_id: 1,
          mainboard: 'Dell 0X123',
          cpu: 'Intel Core i7',
          ram: '16GB',
          o_cung: '512GB SSD',
          he_dieu_hanh_id: 1,
          man_hinh: null,
          phan_mem_diet_virus_id: null,
          ghi_chu: null,
        },
        error: null,
      }),
    };

    client.from
      .mockReturnValueOnce(deviceBuilder)
      .mockReturnValueOnce(configBuilder)
      .mockReturnValueOnce(insertBuilder);

    const result = await service.upsertByDeviceId(1, {
      mainboard: 'Dell 0X123',
      cpu: 'Intel Core i7',
      ram: '16GB',
      oCung: '512GB SSD',
      heDieuHanhId: 1,
    });

    expect(insertBuilder.insert).toHaveBeenCalledWith({
      thiet_bi_id: 1,
      mainboard: 'Dell 0X123',
      cpu: 'Intel Core i7',
      ram: '16GB',
      o_cung: '512GB SSD',
      he_dieu_hanh_id: 1,
      man_hinh: null,
      phan_mem_diet_virus_id: null,
      ghi_chu: null,
    });
    expect(result.thietBiId).toBe(1);
  });

  it('throws when device does not exist', async () => {
    const deviceBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    client.from.mockReturnValue(deviceBuilder);

    await expect(service.getByDeviceId(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
