export interface PhongBanDto {
  id: number;
  maPhongBan: string;
  tenPhongBan: string;
  ghiChu: string | null;
}

export interface PhongBanQueryDto {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PhongBanListResponseDto {
  items: PhongBanDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePhongBanDto {
  maPhongBan: string;
  tenPhongBan: string;
  ghiChu?: string | null;
}

export interface UpdatePhongBanDto {
  maPhongBan: string;
  tenPhongBan: string;
  ghiChu?: string | null;
}

export interface DeletePhongBanResponseDto {
  message: string;
}
