export interface TinhTrangThietBiDto {
  id: number;
  maTinhTrang: string | null;
  tenTinhTrang: string;
  ghiChu: string | null;
}

export interface TinhTrangThietBiQueryDto {
  page?: number;
  limit?: number;
  search?: string;
}

export interface TinhTrangThietBiListResponseDto {
  items: TinhTrangThietBiDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTinhTrangThietBiDto {
  maTinhTrang?: string | null;
  tenTinhTrang: string;
  ghiChu?: string | null;
}

export interface UpdateTinhTrangThietBiDto {
  maTinhTrang?: string | null;
  tenTinhTrang: string;
  ghiChu?: string | null;
}

export interface DeleteTinhTrangThietBiResponseDto {
  message: string;
}
