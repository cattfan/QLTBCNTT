export interface LoaiThietBiDto {
  id: number;
  maLoai: string;
  tenLoai: string;
  ghiChu: string | null;
}

export interface LoaiThietBiQueryDto {
  page?: number;
  limit?: number;
  search?: string;
}

export interface LoaiThietBiListResponseDto {
  items: LoaiThietBiDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateLoaiThietBiDto {
  maLoai: string;
  tenLoai: string;
  ghiChu?: string | null;
}

export interface UpdateLoaiThietBiDto {
  maLoai: string;
  tenLoai: string;
  ghiChu?: string | null;
}

export interface DeleteLoaiThietBiResponseDto {
  message: string;
}
