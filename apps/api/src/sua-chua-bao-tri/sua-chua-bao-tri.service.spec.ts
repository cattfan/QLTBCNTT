import { ConflictException } from '@nestjs/common';
import type { SupabaseService } from '../database';
import { SuaChuaBaoTriService } from './sua-chua-bao-tri.service';

describe('SuaChuaBaoTriService', () => {
  let client: { from: jest.Mock };
  let service: SuaChuaBaoTriService;

  beforeEach(() => {
    client = {
      from: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn(() => client),
    } as unknown as SupabaseService;

    service = new SuaChuaBaoTriService(supabaseService);
  });

  it('creates repair ticket with default cost 0', async () => {
    const deviceBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: 1 },
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
          ngay_ghi_nhan: '2026-04-17',
          ngay_sua_chua: null,
          mo_ta_loi: 'Khong len nguon',
          loai_xu_ly: 'phan_cung',
          don_vi_sua_chua: null,
          chi_phi: 0,
          ket_qua_xu_ly: null,
          ghi_chu: null,
        },
        error: null,
      }),
    };

    client.from
      .mockReturnValueOnce(deviceBuilder)
      .mockReturnValueOnce(insertBuilder);

    const result = await service.create({
      thietBiId: 1,
      moTaLoi: 'Khong len nguon',
      loaiXuLy: 'phan_cung',
    });

    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        chi_phi: 0,
      }),
    );
    expect(result.ticket.status).toBe('dang_xu_ly');
  });

  it('closes repair ticket and updates device status to warehouse', async () => {
    const ticketBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          thiet_bi_id: 1,
          ngay_ghi_nhan: '2026-04-17',
          ngay_sua_chua: null,
          mo_ta_loi: 'Khong len nguon',
          loai_xu_ly: 'phan_cung',
          don_vi_sua_chua: null,
          chi_phi: 0,
          ket_qua_xu_ly: null,
          ghi_chu: null,
        },
        error: null,
      }),
    };
    const closeBuilder = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          thiet_bi_id: 1,
          ngay_ghi_nhan: '2026-04-17',
          ngay_sua_chua: '2026-04-18',
          mo_ta_loi: 'Khong len nguon',
          loai_xu_ly: 'phan_cung',
          don_vi_sua_chua: null,
          chi_phi: 1500000,
          ket_qua_xu_ly: 'Da thay nguon',
          ghi_chu: 'Hoan thanh',
        },
        error: null,
      }),
    };
    const statusBuilder = {
      select: jest.fn().mockResolvedValue({
        data: [{ id: 2, ma_tinh_trang: 'LUU_KHO', ten_tinh_trang: 'Luu kho' }],
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
      .mockReturnValueOnce(ticketBuilder)
      .mockReturnValueOnce(closeBuilder)
      .mockReturnValueOnce(statusBuilder)
      .mockReturnValueOnce(updateDeviceBuilder);

    const result = await service.close(1, {
      chiPhi: 1500000,
      ketQuaXuLy: 'Da thay nguon',
      ghiChu: 'Hoan thanh',
    });

    expect(updateDeviceBuilder.update).toHaveBeenCalledWith({
      tinh_trang_id: 2,
    });
    expect(result.ticket.status).toBe('da_hoan_thanh');
  });

  it('refuses to close a ticket that is already closed', async () => {
    const ticketBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          thiet_bi_id: 1,
          ngay_ghi_nhan: '2026-04-17',
          ngay_sua_chua: '2026-04-18',
          mo_ta_loi: 'Khong len nguon',
          loai_xu_ly: 'phan_cung',
          don_vi_sua_chua: null,
          chi_phi: 0,
          ket_qua_xu_ly: null,
          ghi_chu: null,
        },
        error: null,
      }),
    };

    client.from.mockReturnValueOnce(ticketBuilder);

    await expect(service.close(1, { chiPhi: 0 })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
