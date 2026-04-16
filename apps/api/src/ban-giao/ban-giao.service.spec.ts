import { ConflictException } from '@nestjs/common';
import type { SupabaseService } from '../database';
import { BanGiaoService } from './ban-giao.service';

describe('BanGiaoService', () => {
  let client: { from: jest.Mock };
  let service: BanGiaoService;

  beforeEach(() => {
    client = {
      from: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn(() => client),
    } as unknown as SupabaseService;

    service = new BanGiaoService(supabaseService);
  });

  it('creates handover record and updates device status', async () => {
    const deviceBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          tinh_trang_id: 5,
        },
        error: null,
      }),
    };
    const statusBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: 5,
          ma_tinh_trang: 'LUU_KHO',
          ten_tinh_trang: 'Luu kho',
        },
        error: null,
      }),
    };
    const borrowBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({
        count: 0,
        error: null,
      }),
    };
    const recipientBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: 2,
          phong_ban_id: 3,
        },
        error: null,
      }),
    };
    const usingStatusListBuilder = {
      select: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            ma_tinh_trang: 'DANG_SU_DUNG',
            ten_tinh_trang: 'Dang su dung',
          },
        ],
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
          nguoi_nhan_id: 2,
          phong_ban_nhan_id: 3,
          ngay_ban_giao: '2026-04-16',
          ngay_thu_hoi: null,
          hinh_thuc: 'ban_giao',
          noi_dung: null,
          ghi_chu: null,
        },
        error: null,
      }),
    };
    const updateDeviceBuilder = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        error: null,
      }),
    };

    client.from
      .mockReturnValueOnce(deviceBuilder)
      .mockReturnValueOnce(statusBuilder)
      .mockReturnValueOnce(borrowBuilder)
      .mockReturnValueOnce(recipientBuilder)
      .mockReturnValueOnce(usingStatusListBuilder)
      .mockReturnValueOnce(insertBuilder)
      .mockReturnValueOnce(updateDeviceBuilder);

    const result = await service.create({
      thietBiId: 1,
      nguoiNhanId: 2,
      hinhThuc: 'ban_giao',
    });

    expect(insertBuilder.insert).toHaveBeenCalled();
    expect(updateDeviceBuilder.update).toHaveBeenCalledWith({
      tinh_trang_id: 1,
      nguoi_su_dung_id: 2,
    });
    expect(result.handover.thietBiId).toBe(1);
  });

  it('rejects handover when device is lost', async () => {
    const deviceBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          tinh_trang_id: 9,
        },
        error: null,
      }),
    };
    const statusBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: 9,
          ma_tinh_trang: 'THAT_LAC',
          ten_tinh_trang: 'That lac',
        },
        error: null,
      }),
    };

    client.from
      .mockReturnValueOnce(deviceBuilder)
      .mockReturnValueOnce(statusBuilder);

    await expect(
      service.create({
        thietBiId: 1,
        nguoiNhanId: 2,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects handover when device is already borrowed', async () => {
    const deviceBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          tinh_trang_id: null,
        },
        error: null,
      }),
    };
    const borrowBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({
        count: 1,
        error: null,
      }),
    };

    client.from
      .mockReturnValueOnce(deviceBuilder)
      .mockReturnValueOnce(borrowBuilder);

    await expect(
      service.create({
        thietBiId: 1,
        nguoiNhanId: 2,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
