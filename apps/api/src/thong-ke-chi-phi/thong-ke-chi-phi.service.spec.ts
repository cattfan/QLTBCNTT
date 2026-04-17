import type { SupabaseService } from '../database';
import { ThongKeChiPhiService } from './thong-ke-chi-phi.service';

describe('ThongKeChiPhiService', () => {
  let client: { from: jest.Mock };
  let service: ThongKeChiPhiService;

  beforeEach(() => {
    client = {
      from: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn(() => client),
    } as unknown as SupabaseService;

    service = new ThongKeChiPhiService(supabaseService);
  });

  it('aggregates total repair cost by device type', async () => {
    const repairsBuilder = {
      select: jest.fn().mockResolvedValue({
        data: [
          { thiet_bi_id: 1, chi_phi: 1000000, ngay_ghi_nhan: '2026-04-01' },
          { thiet_bi_id: 2, chi_phi: 500000, ngay_ghi_nhan: '2026-04-10' },
        ],
        error: null,
      }),
    };
    const devicesBuilder = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [
          { id: 1, loai_thiet_bi_id: 1, phong_ban_id: 2 },
          { id: 2, loai_thiet_bi_id: 2, phong_ban_id: 3 },
        ],
        error: null,
      }),
    };
    const typesBuilder = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [
          { id: 1, ten_loai: 'Laptop' },
          { id: 2, ten_loai: 'May in' },
        ],
        error: null,
      }),
    };

    client.from
      .mockReturnValueOnce(repairsBuilder)
      .mockReturnValueOnce(devicesBuilder)
      .mockReturnValueOnce(typesBuilder);

    const result = await service.byDeviceType();

    expect(result.items).toEqual([
      {
        key: '1',
        label: 'Laptop',
        totalCost: 1000000,
      },
      {
        key: '2',
        label: 'May in',
        totalCost: 500000,
      },
    ]);
  });

  it('aggregates repair cost by time granularity', async () => {
    const repairsBuilder = {
      select: jest.fn().mockResolvedValue({
        data: [
          { thiet_bi_id: 1, chi_phi: 1000000, ngay_ghi_nhan: '2026-01-10' },
          { thiet_bi_id: 2, chi_phi: 500000, ngay_ghi_nhan: '2026-02-15' },
          { thiet_bi_id: 3, chi_phi: 700000, ngay_ghi_nhan: '2026-05-01' },
        ],
        error: null,
      }),
    };

    client.from.mockReturnValueOnce(repairsBuilder);

    const result = await service.byTime({ granularity: 'quarter' });

    expect(result).toEqual({
      granularity: 'quarter',
      items: [
        { period: '2026-Q1', totalCost: 1500000 },
        { period: '2026-Q2', totalCost: 700000 },
      ],
    });
  });
});
