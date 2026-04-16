import { ConflictException } from '@nestjs/common';
import type { SupabaseService } from '../database';
import { ThuHoiService } from './thu-hoi.service';

describe('ThuHoiService', () => {
  let client: { from: jest.Mock };
  let service: ThuHoiService;

  beforeEach(() => {
    client = {
      from: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn(() => client),
    } as unknown as SupabaseService;

    service = new ThuHoiService(supabaseService);
  });

  it('closes handover and updates device to warehouse status', async () => {
    const deviceBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: 1 },
        error: null,
      }),
    };
    const handoverBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: 10,
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
    const statusListBuilder = {
      select: jest.fn().mockResolvedValue({
        data: [
          {
            id: 2,
            ma_tinh_trang: 'LUU_KHO',
            ten_tinh_trang: 'Luu kho',
          },
        ],
        error: null,
      }),
    };
    const updateHandoverBuilder = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 10,
          thiet_bi_id: 1,
          nguoi_nhan_id: 2,
          phong_ban_nhan_id: 3,
          ngay_ban_giao: '2026-04-16',
          ngay_thu_hoi: '2026-04-17',
          hinh_thuc: 'ban_giao',
          noi_dung: null,
          ghi_chu: 'Thu hoi',
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
      .mockReturnValueOnce(handoverBuilder)
      .mockReturnValueOnce(statusListBuilder)
      .mockReturnValueOnce(updateHandoverBuilder)
      .mockReturnValueOnce(updateDeviceBuilder);

    const result = await service.create({
      thietBiId: 1,
      ghiChu: 'Thu hoi',
    });

    expect(updateDeviceBuilder.update).toHaveBeenCalledWith({
      nguoi_su_dung_id: null,
      tinh_trang_id: 2,
    });
    expect(result.handover.id).toBe(10);
  });

  it('rejects recall when no active handover exists', async () => {
    const deviceBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: 1 },
        error: null,
      }),
    };
    const handoverBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    client.from
      .mockReturnValueOnce(deviceBuilder)
      .mockReturnValueOnce(handoverBuilder);

    await expect(
      service.create({
        thietBiId: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
