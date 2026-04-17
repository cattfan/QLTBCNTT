import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import type {
  Database,
  ExportThietBiReportQueryDto,
  Tables,
} from '@repo/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../database';

type ThietBiRow = Tables<'thiet_bi'>;
type LichSuBanGiaoRow = Tables<'lich_su_ban_giao'>;
type LoaiThietBiRow = Pick<Tables<'loai_thiet_bi'>, 'id' | 'ten_loai'>;
type HangModelRow = Pick<Tables<'hang_model'>, 'id' | 'ten_hang' | 'ten_model'>;
type PhongBanRow = Pick<Tables<'phong_ban'>, 'id' | 'ten_phong_ban'>;
type NguoiDungRow = Pick<
  Tables<'nguoi_dung'>,
  'id' | 'ten_dang_nhap' | 'ho_ten' | 'email' | 'phong_ban_id'
>;
type TinhTrangRow = Pick<
  Tables<'tinh_trang_thiet_bi'>,
  'id' | 'ten_tinh_trang'
>;
type NguonGocRow = Pick<Tables<'nguon_goc_tai_san'>, 'id' | 'ten_nguon_goc'>;

interface ReportFile {
  filename: string;
  mimeType: string;
  content: Buffer;
}

interface AuthReportUser {
  name: string;
  username: string;
}

interface DeviceExcelRow {
  maThietBi: string;
  tenThietBi: string;
  serial: string;
  loaiThietBi: string;
  hangModel: string;
  phongBan: string;
  nguoiSuDung: string;
  tinhTrang: string;
  namTrangBi: string;
  ngayTiepNhan: string;
  nguonGoc: string;
  ghiChu: string;
}

@Injectable()
export class XuatBaoCaoService {
  private readonly client: SupabaseClient<Database>;

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getClient();
  }

  async exportThietBiExcel(
    query: ExportThietBiReportQueryDto,
  ): Promise<ReportFile> {
    const devices = await this.loadDevices(query);
    const rows = await this.buildDeviceExcelRows(devices);
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'QLTBCNTT API';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Danh sach thiet bi', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    worksheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Ma thiet bi', key: 'maThietBi', width: 18 },
      { header: 'Ten thiet bi', key: 'tenThietBi', width: 28 },
      { header: 'Serial', key: 'serial', width: 20 },
      { header: 'Loai thiet bi', key: 'loaiThietBi', width: 18 },
      { header: 'Hang / Model', key: 'hangModel', width: 24 },
      { header: 'Phong ban', key: 'phongBan', width: 22 },
      { header: 'Nguoi su dung', key: 'nguoiSuDung', width: 24 },
      { header: 'Tinh trang', key: 'tinhTrang', width: 18 },
      { header: 'Nam trang bi', key: 'namTrangBi', width: 14 },
      { header: 'Ngay tiep nhan', key: 'ngayTiepNhan', width: 16 },
      { header: 'Nguon goc', key: 'nguonGoc', width: 22 },
      { header: 'Ghi chu', key: 'ghiChu', width: 28 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' },
    };

    if (rows.length === 0) {
      worksheet.mergeCells('A2:M2');
      worksheet.getCell('A2').value = 'Khong co du lieu thiet bi phu hop';
      worksheet.getCell('A2').alignment = { horizontal: 'center' };
    } else {
      rows.forEach((item, index) => {
        const row = worksheet.addRow({
          stt: index + 1,
          ...item,
        });
        row.alignment = {
          vertical: 'middle',
          horizontal: 'left',
          wrapText: true,
        };
      });
    }

    worksheet.autoFilter = {
      from: 'A1',
      to: 'M1',
    };

    const content = this.ensureBuffer(await workbook.xlsx.writeBuffer());

    return {
      filename: `danh-sach-thiet-bi-${this.getToday()}.xlsx`,
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      content,
    };
  }

  async exportBanGiaoPdf(
    handoverId: number,
    issuer?: AuthReportUser,
  ): Promise<ReportFile> {
    const handover = await this.loadHandover(handoverId);
    const [device, receiver, department] = await Promise.all([
      this.loadDevice(handover.thiet_bi_id),
      handover.nguoi_nhan_id != null
        ? this.loadUser(handover.nguoi_nhan_id)
        : Promise.resolve(null),
      this.loadDepartment(handover.phong_ban_nhan_id),
    ]);

    return {
      filename: `bien-ban-ban-giao-${handoverId}-${this.toSafeFilename(device.ma_thiet_bi)}.pdf`,
      mimeType: 'application/pdf',
      content: await this.buildBanGiaoPdfBuffer({
        handover,
        device,
        receiver,
        department,
        issuer,
      }),
    };
  }

  private async loadDevices(
    query: ExportThietBiReportQueryDto,
  ): Promise<ThietBiRow[]> {
    let queryBuilder = this.client.from('thiet_bi').select('*');

    if (query.phongBanId !== undefined) {
      queryBuilder = queryBuilder.eq('phong_ban_id', query.phongBanId);
    }

    if (query.tinhTrangId !== undefined) {
      queryBuilder = queryBuilder.eq('tinh_trang_id', query.tinhTrangId);
    }

    if (query.loaiThietBiId !== undefined) {
      queryBuilder = queryBuilder.eq('loai_thiet_bi_id', query.loaiThietBiId);
    }

    const search = query.search?.trim();

    if (search) {
      queryBuilder = queryBuilder.or(
        `ma_thiet_bi.ilike.%${search}%,ten_thiet_bi.ilike.%${search}%,serial.ilike.%${search}%`,
      );
    }

    const { data, error } = await queryBuilder.order('id', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay du lieu thiet bi de xuat bao cao',
      );
    }

    return data ?? [];
  }

  private async buildDeviceExcelRows(
    devices: ThietBiRow[],
  ): Promise<DeviceExcelRow[]> {
    const loaiIds = Array.from(
      new Set(devices.map((item) => item.loai_thiet_bi_id)),
    );
    const hangModelIds = Array.from(
      new Set(
        devices
          .map((item) => item.hang_model_id)
          .filter((id): id is number => id != null),
      ),
    );
    const phongBanIds = Array.from(
      new Set(
        devices
          .map((item) => item.phong_ban_id)
          .filter((id): id is number => id != null),
      ),
    );
    const nguoiDungIds = Array.from(
      new Set(
        devices
          .map((item) => item.nguoi_su_dung_id)
          .filter((id): id is number => id != null),
      ),
    );
    const tinhTrangIds = Array.from(
      new Set(
        devices
          .map((item) => item.tinh_trang_id)
          .filter((id): id is number => id != null),
      ),
    );
    const nguonGocIds = Array.from(
      new Set(
        devices
          .map((item) => item.nguon_goc_id)
          .filter((id): id is number => id != null),
      ),
    );

    const [
      loaiMap,
      hangModelMap,
      phongBanMap,
      nguoiDungMap,
      tinhTrangMap,
      nguonGocMap,
    ] = await Promise.all([
      this.loadReferenceMap<LoaiThietBiRow>(
        'loai_thiet_bi',
        'id, ten_loai',
        loaiIds,
        'Khong the lay thong tin loai thiet bi',
      ),
      this.loadReferenceMap<HangModelRow>(
        'hang_model',
        'id, ten_hang, ten_model',
        hangModelIds,
        'Khong the lay thong tin hang/model',
      ),
      this.loadReferenceMap<PhongBanRow>(
        'phong_ban',
        'id, ten_phong_ban',
        phongBanIds,
        'Khong the lay thong tin phong ban',
      ),
      this.loadReferenceMap<NguoiDungRow>(
        'nguoi_dung',
        'id, ten_dang_nhap, ho_ten, email, phong_ban_id',
        nguoiDungIds,
        'Khong the lay thong tin nguoi su dung',
      ),
      this.loadReferenceMap<TinhTrangRow>(
        'tinh_trang_thiet_bi',
        'id, ten_tinh_trang',
        tinhTrangIds,
        'Khong the lay thong tin tinh trang thiet bi',
      ),
      this.loadReferenceMap<NguonGocRow>(
        'nguon_goc_tai_san',
        'id, ten_nguon_goc',
        nguonGocIds,
        'Khong the lay thong tin nguon goc tai san',
      ),
    ]);

    return devices.map((device) => {
      const loai = loaiMap.get(device.loai_thiet_bi_id);
      const hangModel =
        device.hang_model_id != null
          ? hangModelMap.get(device.hang_model_id)
          : undefined;
      const phongBan =
        device.phong_ban_id != null
          ? phongBanMap.get(device.phong_ban_id)
          : undefined;
      const nguoiDung =
        device.nguoi_su_dung_id != null
          ? nguoiDungMap.get(device.nguoi_su_dung_id)
          : undefined;
      const tinhTrang =
        device.tinh_trang_id != null
          ? tinhTrangMap.get(device.tinh_trang_id)
          : undefined;
      const nguonGoc =
        device.nguon_goc_id != null
          ? nguonGocMap.get(device.nguon_goc_id)
          : undefined;

      return {
        maThietBi: device.ma_thiet_bi,
        tenThietBi: device.ten_thiet_bi,
        serial: device.serial ?? '',
        loaiThietBi: loai?.ten_loai ?? '',
        hangModel: this.toHangModelLabel(hangModel),
        phongBan: phongBan?.ten_phong_ban ?? '',
        nguoiSuDung: nguoiDung?.ho_ten ?? nguoiDung?.ten_dang_nhap ?? '',
        tinhTrang: tinhTrang?.ten_tinh_trang ?? '',
        namTrangBi:
          device.nam_trang_bi != null ? String(device.nam_trang_bi) : '',
        ngayTiepNhan: this.formatDate(device.ngay_tiep_nhan),
        nguonGoc: nguonGoc?.ten_nguon_goc ?? '',
        ghiChu: device.ghi_chu ?? '',
      };
    });
  }

  private async loadHandover(id: number): Promise<LichSuBanGiaoRow> {
    const { data, error } = await this.client
      .from('lich_su_ban_giao')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay thong tin bien ban ban giao',
      );
    }

    if (!data) {
      throw new NotFoundException('Khong tim thay bien ban ban giao');
    }

    return data;
  }

  private async loadDevice(id: number): Promise<ThietBiRow> {
    const { data, error } = await this.client
      .from('thiet_bi')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay thong tin thiet bi cho bien ban',
      );
    }

    if (!data) {
      throw new NotFoundException('Khong tim thay thiet bi cho bien ban');
    }

    return data;
  }

  private async loadUser(id: number): Promise<NguoiDungRow | null> {
    const { data, error } = await this.client
      .from('nguoi_dung')
      .select('id, ten_dang_nhap, ho_ten, email, phong_ban_id')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay thong tin nguoi nhan cho bien ban',
      );
    }

    return data;
  }

  private async loadDepartment(id: number | null): Promise<PhongBanRow | null> {
    if (id == null) {
      return null;
    }

    const { data, error } = await this.client
      .from('phong_ban')
      .select('id, ten_phong_ban')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Khong the lay thong tin phong ban cho bien ban',
      );
    }

    return data;
  }

  private async buildBanGiaoPdfBuffer(payload: {
    handover: LichSuBanGiaoRow;
    device: ThietBiRow;
    receiver: NguoiDungRow | null;
    department: PhongBanRow | null;
    issuer?: AuthReportUser;
  }): Promise<Buffer> {
    const document = new PDFDocument({
      size: 'A4',
      margin: 50,
      compress: false,
    });

    const chunks: Buffer[] = [];

    return await new Promise<Buffer>((resolve, reject) => {
      document.on('data', (chunk: Buffer) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);

      document.font('Helvetica');
      document.fontSize(18).text('BIEN BAN BAN GIAO THIET BI', {
        align: 'center',
      });
      document.moveDown(0.5);
      document
        .fontSize(11)
        .text(
          `Ngay lap bien ban: ${this.formatDate(payload.handover.ngay_ban_giao)}`,
          {
            align: 'right',
          },
        );

      document.moveDown();
      document.fontSize(12).text('Thong tin thiet bi', {
        underline: true,
      });
      this.writePdfField(document, 'Ma thiet bi', payload.device.ma_thiet_bi);
      this.writePdfField(document, 'Ten thiet bi', payload.device.ten_thiet_bi);
      this.writePdfField(document, 'Serial', payload.device.serial ?? '');
      this.writePdfField(
        document,
        'Ngay tiep nhan',
        this.formatDate(payload.device.ngay_tiep_nhan),
      );

      document.moveDown(0.5);
      document.fontSize(12).text('Thong tin ben nhan', {
        underline: true,
      });
      this.writePdfField(
        document,
        'Ho ten',
        payload.receiver?.ho_ten ?? 'Khong xac dinh',
      );
      this.writePdfField(
        document,
        'Ten dang nhap',
        payload.receiver?.ten_dang_nhap ?? '',
      );
      this.writePdfField(document, 'Email', payload.receiver?.email ?? '');
      this.writePdfField(
        document,
        'Phong ban',
        payload.department?.ten_phong_ban ?? 'Khong xac dinh',
      );

      document.moveDown(0.5);
      document.fontSize(12).text('Thong tin ban giao', {
        underline: true,
      });
      this.writePdfField(
        document,
        'Hinh thuc',
        payload.handover.hinh_thuc ?? '',
      );
      this.writePdfField(
        document,
        'Noi dung',
        payload.handover.noi_dung ??
          'Ban giao thiet bi cho nguoi su dung theo nhu cau cong viec',
      );
      this.writePdfField(document, 'Ghi chu', payload.handover.ghi_chu ?? '');
      this.writePdfField(
        document,
        'Ngay thu hoi',
        this.formatDate(payload.handover.ngay_thu_hoi),
      );

      document.moveDown();
      document
        .fontSize(11)
        .text(
          'Hai ben xac nhan thiet bi da duoc ban giao va tiep nhan dung hien trang.',
        );

      const signatureTop = document.y + 40;
      const leftX = 70;
      const rightX = 330;
      const columnWidth = 180;

      document.fontSize(12).text('BEN GIAO', leftX, signatureTop, {
        width: columnWidth,
        align: 'center',
      });
      document.text('BEN NHAN', rightX, signatureTop, {
        width: columnWidth,
        align: 'center',
      });
      document
        .fontSize(10)
        .text('(Ky, ghi ro ho ten)', leftX, signatureTop + 18, {
          width: columnWidth,
          align: 'center',
        });
      document.text('(Ky, ghi ro ho ten)', rightX, signatureTop + 18, {
        width: columnWidth,
        align: 'center',
      });

      document
        .moveTo(leftX + 20, signatureTop + 110)
        .lineTo(leftX + columnWidth - 20, signatureTop + 110)
        .stroke();
      document
        .moveTo(rightX + 20, signatureTop + 110)
        .lineTo(rightX + columnWidth - 20, signatureTop + 110)
        .stroke();

      document.text(
        payload.issuer?.name ?? 'Nguoi lap bien ban',
        leftX,
        signatureTop + 116,
        {
          width: columnWidth,
          align: 'center',
        },
      );
      document.text(
        payload.receiver?.ho_ten ?? 'Nguoi nhan thiet bi',
        rightX,
        signatureTop + 116,
        {
          width: columnWidth,
          align: 'center',
        },
      );

      document.end();
    });
  }

  private async loadReferenceMap<Row extends { id: number }>(
    tableName:
      | 'loai_thiet_bi'
      | 'hang_model'
      | 'phong_ban'
      | 'nguoi_dung'
      | 'tinh_trang_thiet_bi'
      | 'nguon_goc_tai_san',
    selectColumns: string,
    ids: number[],
    errorMessage: string,
  ): Promise<Map<number, Row>> {
    if (ids.length === 0) {
      return new Map();
    }

    const { data, error } = await this.client
      .from(tableName)
      .select(selectColumns)
      .in('id', ids);

    if (error) {
      throw new InternalServerErrorException(errorMessage);
    }

    return new Map(
      ((data ?? []) as unknown as Row[]).map((item) => [item.id, item]),
    );
  }

  private writePdfField(
    document: PDFKit.PDFDocument,
    label: string,
    value: string,
  ): void {
    document.fontSize(11).text(`${label}: ${value || 'Khong co'}`);
  }

  private ensureBuffer(value: Buffer | ArrayBuffer): Buffer {
    return Buffer.isBuffer(value) ? value : Buffer.from(value);
  }

  private formatDate(value: string | null): string {
    if (!value) {
      return '';
    }

    const [year, month, day] = value.split('-');

    if (!year || !month || !day) {
      return value;
    }

    return `${day}/${month}/${year}`;
  }

  private toHangModelLabel(value?: HangModelRow): string {
    if (!value) {
      return '';
    }

    return value.ten_model
      ? `${value.ten_hang} ${value.ten_model}`
      : value.ten_hang;
  }

  private toSafeFilename(value: string): string {
    return value.replace(/[^a-zA-Z0-9-_]+/g, '-');
  }

  private getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
