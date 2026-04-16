export type LichSuBanGiaoStatus = 'dang_muon' | 'da_tra';

export interface LichSuBanGiaoDto {
  id: number;
  thietBiId: number;
  thietBiCode: string;
  thietBiName: string;
  nguoiNhanId: number | null;
  employeeCode: string | null;
  employeeName: string | null;
  phongBanNhanId: number | null;
  handoverDate: string;
  returnDate: string | null;
  status: LichSuBanGiaoStatus;
  handoverType: string | null;
  content: string | null;
  note: string | null;
}

export interface LichSuBanGiaoQueryDto {
  page?: number;
  limit?: number;
  employeeCode?: string;
  deviceCode?: string;
  status?: LichSuBanGiaoStatus;
}

export interface LichSuBanGiaoListResponseDto {
  items: LichSuBanGiaoDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
