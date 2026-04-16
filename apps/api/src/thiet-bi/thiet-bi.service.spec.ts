import { ConflictException } from '@nestjs/common';
import type { SupabaseService } from '../database';
import { ThietBiService } from './thiet-bi.service';

describe('ThietBiService', () => {
  const deviceRow = {
    id: 1,
    ma_thiet_bi: 'TB-001',
    ten_thiet_bi: 'Laptop Dell Latitude',
    serial: 'SN-001',
    loai_thiet_bi_id: 1,
    hang_model_id: 2,
    nguon_goc_id: 1,
    phong_ban_id: 3,
    nguoi_su_dung_id: 4,
    tinh_trang_id: 1,
    nam_trang_bi: 2025,
    ngay_tiep_nhan: '2026-04-16',
    la_thiet_bi_dung_chung: false,
    thiet_bi_mat: false,
    ghi_chu: 'May van phong',
  };

  let client: { from: jest.Mock };
  let service: ThietBiService;

  beforeEach(() => {
    client = {
      from: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn(() => client),
    } as unknown as SupabaseService;

    service = new ThietBiService(supabaseService);
  });

  it('lists devices with filters applied', async () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [deviceRow],
        count: 1,
        error: null,
      }),
    };

    client.from.mockReturnValue(queryBuilder);

    const result = await service.list({
      page: 1,
      limit: 10,
      search: 'Dell',
      phongBanId: 3,
      tinhTrangId: 1,
      loaiThietBiId: 1,
    });

    expect(client.from).toHaveBeenCalledWith('thiet_bi');
    expect(result.items[0]?.serial).toBe('SN-001');
  });

  it('rejects duplicate serial on create', async () => {
    const serialBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [{ id: 1 }],
        error: null,
      }),
    };

    client.from.mockReturnValue(serialBuilder);

    await expect(
      service.createItem({
        maThietBi: 'TB-001',
        tenThietBi: 'Laptop',
        serial: 'SN-001',
        loaiThietBiId: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses to delete when device is assigned or under repair', async () => {
    const handoverBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({
        count: 1,
        error: null,
      }),
    };

    client.from.mockReturnValue(handoverBuilder);

    await expect(service.removeItem(1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
