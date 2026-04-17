export type SuaChuaBaoTriStatus = 'dang_xu_ly' | 'da_hoan_thanh';

export interface CreateSuaChuaBaoTriDto {
  thietBiId: number;
  moTaLoi: string;
  loaiXuLy?: string | null;
  donViSuaChua?: string | null;
  ghiChu?: string | null;
}

export interface CloseSuaChuaBaoTriDto {
  chiPhi: number;
  ketQuaXuLy?: string | null;
  ghiChu?: string | null;
}

export interface SuaChuaBaoTriDto {
  id: number;
  thietBiId: number;
  ngayGhiNhan: string;
  ngaySuaChua: string | null;
  moTaLoi: string | null;
  loaiXuLy: string | null;
  donViSuaChua: string | null;
  chiPhi: number | null;
  ketQuaXuLy: string | null;
  ghiChu: string | null;
  status: SuaChuaBaoTriStatus;
}

export interface SuaChuaBaoTriListQueryDto {
  page?: number;
  limit?: number;
  status?: SuaChuaBaoTriStatus;
}

export interface SuaChuaBaoTriListResponseDto {
  items: SuaChuaBaoTriDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SuaChuaBaoTriActionResponseDto {
  message: string;
  ticket: SuaChuaBaoTriDto;
}
