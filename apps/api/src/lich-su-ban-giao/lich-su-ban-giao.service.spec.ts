import type { SupabaseService } from '../database';
import { LichSuBanGiaoService } from './lich-su-ban-giao.service';

describe('LichSuBanGiaoService', () => {
  let client: { from: jest.Mock };
  let service: LichSuBanGiaoService;

  beforeEach(() => {
    client = {
      from: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn(() => client),
    } as unknown as SupabaseService;

    service = new LichSuBanGiaoService(supabaseService);
  });

  it('filters history by employee code, device code, and status', async () => {
    const historyBuilder = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          {
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
          {
            id: 2,
            thiet_bi_id: 2,
            nguoi_nhan_id: 3,
            phong_ban_nhan_id: 4,
            ngay_ban_giao: '2026-04-10',
            ngay_thu_hoi: '2026-04-12',
            hinh_thuc: 'ban_giao',
            noi_dung: null,
            ghi_chu: null,
          },
        ],
        error: null,
      }),
    };
    const usersBuilder = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [
          { id: 2, ten_dang_nhap: 'nguyenvana', ho_ten: 'Nguyen Van A' },
          { id: 3, ten_dang_nhap: 'nguyenvanb', ho_ten: 'Nguyen Van B' },
        ],
        error: null,
      }),
    };
    const devicesBuilder = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [
          { id: 1, ma_thiet_bi: 'TB-001', ten_thiet_bi: 'Laptop Dell' },
          { id: 2, ma_thiet_bi: 'TB-002', ten_thiet_bi: 'May in HP' },
        ],
        error: null,
      }),
    };

    client.from
      .mockReturnValueOnce(historyBuilder)
      .mockReturnValueOnce(usersBuilder)
      .mockReturnValueOnce(devicesBuilder);

    const result = await service.findAll({
      page: 1,
      limit: 10,
      employeeCode: 'nguyenvana',
      deviceCode: 'TB-001',
      status: 'dang_muon',
    });

    expect(result.items).toEqual([
      {
        id: 1,
        thietBiId: 1,
        thietBiCode: 'TB-001',
        thietBiName: 'Laptop Dell',
        nguoiNhanId: 2,
        employeeCode: 'nguyenvana',
        employeeName: 'Nguyen Van A',
        phongBanNhanId: 3,
        handoverDate: '2026-04-16',
        returnDate: null,
        status: 'dang_muon',
        handoverType: 'ban_giao',
        content: null,
        note: null,
      },
    ]);
  });
});
