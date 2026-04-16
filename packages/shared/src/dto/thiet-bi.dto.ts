export interface ThietBiDto {
  id: number;
  maThietBi: string;
  tenThietBi: string;
  serial: string | null;
  loaiThietBiId: number;
  hangModelId: number | null;
  nguonGocId: number | null;
  phongBanId: number | null;
  nguoiSuDungId: number | null;
  tinhTrangId: number | null;
  namTrangBi: number | null;
  ngayTiepNhan: string | null;
  laThietBiDungChung: boolean | null;
  thietBiMat: boolean | null;
  ghiChu: string | null;
}

export interface ThietBiQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  phongBanId?: number;
  tinhTrangId?: number;
  loaiThietBiId?: number;
}

export interface ThietBiListResponseDto {
  items: ThietBiDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateThietBiDto {
  maThietBi: string;
  tenThietBi: string;
  serial?: string | null;
  loaiThietBiId: number;
  hangModelId?: number | null;
  nguonGocId?: number | null;
  phongBanId?: number | null;
  nguoiSuDungId?: number | null;
  tinhTrangId?: number | null;
  namTrangBi?: number | null;
  ngayTiepNhan?: string | null;
  laThietBiDungChung?: boolean | null;
  thietBiMat?: boolean | null;
  ghiChu?: string | null;
}

export interface UpdateThietBiDto extends CreateThietBiDto {}

export interface DeleteThietBiResponseDto {
  message: string;
}
