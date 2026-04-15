export interface NguonGocTaiSanDto {
  id: number;
  maNguonGoc: string | null;
  tenNguonGoc: string;
  ghiChu: string | null;
}

export interface NguonGocTaiSanQueryDto {
  page?: number;
  limit?: number;
  search?: string;
}

export interface NguonGocTaiSanListResponseDto {
  items: NguonGocTaiSanDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateNguonGocTaiSanDto {
  maNguonGoc?: string | null;
  tenNguonGoc: string;
  ghiChu?: string | null;
}

export interface UpdateNguonGocTaiSanDto {
  maNguonGoc?: string | null;
  tenNguonGoc: string;
  ghiChu?: string | null;
}

export interface DeleteNguonGocTaiSanResponseDto {
  message: string;
}
