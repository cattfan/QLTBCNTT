import ExcelJS from 'exceljs';
import type { SupabaseService } from '../database';
import { XuatBaoCaoService } from './xuat-bao-cao.service';

describe('XuatBaoCaoService', () => {
  let client: {
    from: jest.Mock;
  };
  let service: XuatBaoCaoService;

  beforeEach(() => {
    client = {
      from: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn(() => client),
    } as unknown as SupabaseService;

    service = new XuatBaoCaoService(supabaseService);
  });

  it('exports device list to excel with joined lookup data', async () => {
    const thietBiBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            ma_thiet_bi: 'TB-001',
            ten_thiet_bi: 'Laptop Dell Latitude',
            serial: 'SN-001',
            loai_thiet_bi_id: 2,
            hang_model_id: 3,
            nguon_goc_id: 4,
            phong_ban_id: 5,
            nguoi_su_dung_id: 6,
            tinh_trang_id: 7,
            nam_trang_bi: 2026,
            ngay_tiep_nhan: '2026-04-05',
            la_thiet_bi_dung_chung: false,
            thiet_bi_mat: false,
            ghi_chu: 'Cap cho phong CNTT',
          },
        ],
        error: null,
      }),
    };

    const loaiBuilder = createInBuilder([
      {
        id: 2,
        ten_loai: 'Laptop',
      },
    ]);
    const hangModelBuilder = createInBuilder([
      {
        id: 3,
        ten_hang: 'Dell',
        ten_model: 'Latitude 7420',
      },
    ]);
    const nguonGocBuilder = createInBuilder([
      {
        id: 4,
        ten_nguon_goc: 'Ngan sach nha nuoc',
      },
    ]);
    const phongBanBuilder = createInBuilder([
      {
        id: 5,
        ten_phong_ban: 'Phong CNTT',
      },
    ]);
    const nguoiDungBuilder = createInBuilder([
      {
        id: 6,
        ten_dang_nhap: 'nguyenvana',
        ho_ten: 'Nguyen Van A',
        email: 'a@example.com',
        phong_ban_id: 5,
      },
    ]);
    const tinhTrangBuilder = createInBuilder([
      {
        id: 7,
        ten_tinh_trang: 'Dang su dung',
      },
    ]);

    client.from.mockImplementation((tableName: string) => {
      switch (tableName) {
        case 'thiet_bi':
          return thietBiBuilder;
        case 'loai_thiet_bi':
          return loaiBuilder;
        case 'hang_model':
          return hangModelBuilder;
        case 'nguon_goc_tai_san':
          return nguonGocBuilder;
        case 'phong_ban':
          return phongBanBuilder;
        case 'nguoi_dung':
          return nguoiDungBuilder;
        case 'tinh_trang_thiet_bi':
          return tinhTrangBuilder;
        default:
          throw new Error(`Unexpected table ${tableName}`);
      }
    });

    const result = await service.exportThietBiExcel({
      search: 'TB-001',
      phongBanId: 5,
    });

    expect(thietBiBuilder.eq).toHaveBeenCalledWith('phong_ban_id', 5);
    expect(thietBiBuilder.or).toHaveBeenCalledWith(
      'ma_thiet_bi.ilike.%TB-001%,ten_thiet_bi.ilike.%TB-001%,serial.ilike.%TB-001%',
    );
    expect(result.filename).toMatch(/^danh-sach-thiet-bi-.*\.xlsx$/);
    expect(result.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    const workbook = new ExcelJS.Workbook();
    const excelContent = Uint8Array.from(result.content).buffer;
    await workbook.xlsx.load(excelContent);

    const worksheet = workbook.getWorksheet('Danh sach thiet bi');
    expect(worksheet).toBeDefined();

    if (!worksheet) {
      throw new Error('Worksheet was not created');
    }

    expect(worksheet.getCell('B2').value).toBe('TB-001');
    expect(worksheet.getCell('C2').value).toBe('Laptop Dell Latitude');
    expect(worksheet.getCell('E2').value).toBe('Laptop');
    expect(worksheet.getCell('F2').value).toBe('Dell Latitude 7420');
    expect(worksheet.getCell('G2').value).toBe('Phong CNTT');
    expect(worksheet.getCell('H2').value).toBe('Nguyen Van A');
    expect(worksheet.getCell('I2').value).toBe('Dang su dung');
    expect(worksheet.getCell('K2').value).toBe('05/04/2026');
  });

  it('exports handover minute to pdf with signature placeholders', async () => {
    const handoverBuilder = createSingleBuilder({
      id: 10,
      thiet_bi_id: 1,
      nguoi_nhan_id: 2,
      phong_ban_nhan_id: 3,
      ngay_ban_giao: '2026-04-17',
      ngay_thu_hoi: null,
      hinh_thuc: 'ban_giao',
      noi_dung: 'Ban giao laptop cho nhan vien moi',
      ghi_chu: 'Tinh trang tot',
    });
    const deviceBuilder = createSingleBuilder({
      id: 1,
      ma_thiet_bi: 'TB-001',
      ten_thiet_bi: 'Laptop Dell Latitude',
      serial: 'SN-001',
      loai_thiet_bi_id: 2,
      hang_model_id: 3,
      nguon_goc_id: null,
      phong_ban_id: 3,
      nguoi_su_dung_id: 2,
      tinh_trang_id: 7,
      nam_trang_bi: 2026,
      ngay_tiep_nhan: '2026-04-05',
      la_thiet_bi_dung_chung: false,
      thiet_bi_mat: false,
      ghi_chu: null,
    });
    const userBuilder = createSingleBuilder({
      id: 2,
      ten_dang_nhap: 'nguyenvana',
      ho_ten: 'Nguyen Van A',
      email: 'a@example.com',
      phong_ban_id: 3,
    });
    const departmentBuilder = createSingleBuilder({
      id: 3,
      ten_phong_ban: 'Phong CNTT',
    });

    client.from.mockImplementation((tableName: string) => {
      switch (tableName) {
        case 'lich_su_ban_giao':
          return handoverBuilder;
        case 'thiet_bi':
          return deviceBuilder;
        case 'nguoi_dung':
          return userBuilder;
        case 'phong_ban':
          return departmentBuilder;
        default:
          throw new Error(`Unexpected table ${tableName}`);
      }
    });

    const result = await service.exportBanGiaoPdf(10, {
      name: 'Administrator',
      username: 'admin',
    });

    expect(result.filename).toContain('bien-ban-ban-giao-10-TB-001.pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.content.subarray(0, 4).toString()).toBe('%PDF');

    const pdfContent = result.content.toString('latin1');
    expect(pdfContent).toContain('<4249454e2042414e2042414e20474941>');
    expect(pdfContent).toContain('<5448494554204249>');
    expect(pdfContent).toContain('<42454e20474941>');
    expect(pdfContent).toContain('<42454e204e48414e>');
    expect(pdfContent).toContain('4c6170746f702044656c6c204c61746974756465');
    expect(pdfContent).toContain('4e677579');
  });

  function createInBuilder(data: unknown[]) {
    return {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data,
        error: null,
      }),
    };
  }

  function createSingleBuilder(data: unknown) {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data,
        error: null,
      }),
    };
  }
});
