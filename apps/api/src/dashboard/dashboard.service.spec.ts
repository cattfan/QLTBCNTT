import type { SupabaseService } from '../database';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let client: { from: jest.Mock };
  let service: DashboardService;

  beforeEach(() => {
    client = {
      from: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn(() => client),
    } as unknown as SupabaseService;

    service = new DashboardService(supabaseService);
  });

  it('returns overview counts', async () => {
    const devicesBuilder = {
      select: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            ma_thiet_bi: 'TB-001',
            ten_thiet_bi: 'Laptop',
            phong_ban_id: 2,
            tinh_trang_id: 1,
          },
          {
            id: 2,
            ma_thiet_bi: 'TB-002',
            ten_thiet_bi: 'May in',
            phong_ban_id: 3,
            tinh_trang_id: 2,
          },
        ],
        error: null,
      }),
    };
    const statusesBuilder = {
      select: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            ma_tinh_trang: 'DANG_SU_DUNG',
            ten_tinh_trang: 'Dang su dung',
          },
          { id: 2, ma_tinh_trang: 'LUU_KHO', ten_tinh_trang: 'Luu kho' },
        ],
        error: null,
      }),
    };
    const openRepairsBuilder = {
      select: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            thiet_bi_id: 1,
            ngay_ghi_nhan: '2026-04-17',
            mo_ta_loi: 'Khong len nguon',
          },
        ],
        error: null,
      }),
    };

    client.from
      .mockReturnValueOnce(devicesBuilder)
      .mockReturnValueOnce(statusesBuilder)
      .mockReturnValueOnce(openRepairsBuilder);

    const result = await service.getOverview();

    expect(result).toEqual({
      totalDevices: 2,
      inUseDevices: 1,
      inStockDevices: 1,
      inRepairDevices: 1,
    });
  });

  it('builds recent events list', async () => {
    const devicesBuilder = {
      select: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            ma_thiet_bi: 'TB-001',
            ten_thiet_bi: 'Laptop Dell',
            phong_ban_id: 2,
            tinh_trang_id: 1,
          },
        ],
        error: null,
      }),
    };
    const usersBuilder = {
      select: jest.fn().mockResolvedValue({
        data: [{ id: 2, ten_dang_nhap: 'nguyenvana', ho_ten: 'Nguyen Van A' }],
        error: null,
      }),
    };
    const handoversBuilder = {
      select: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            thiet_bi_id: 1,
            nguoi_nhan_id: 2,
            phong_ban_nhan_id: 3,
            ngay_ban_giao: '2026-04-16',
            ngay_thu_hoi: null,
            hinh_thuc: 'ban_giao',
            noi_dung: 'Cap cho nhan vien moi',
            ghi_chu: null,
          },
        ],
        error: null,
      }),
    };
    const repairsBuilder = {
      select: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            thiet_bi_id: 1,
            ngay_ghi_nhan: '2026-04-17',
            mo_ta_loi: 'Khong len nguon',
          },
        ],
        error: null,
      }),
    };

    client.from
      .mockReturnValueOnce(devicesBuilder)
      .mockReturnValueOnce(usersBuilder)
      .mockReturnValueOnce(handoversBuilder)
      .mockReturnValueOnce(repairsBuilder);

    const result = await service.getRecentEvents();

    expect(result.items[0]?.eventType).toBe('bao_hong');
    expect(result.items[1]?.eventType).toBe('ban_giao');
  });
});
