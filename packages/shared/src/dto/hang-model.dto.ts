export interface HangModelDto {
  id: number;
  tenHang: string;
  tenModel: string | null;
  ghiChu: string | null;
}

export interface HangModelQueryDto {
  page?: number;
  limit?: number;
  search?: string;
}

export interface HangModelListResponseDto {
  items: HangModelDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateHangModelDto {
  tenHang: string;
  tenModel?: string | null;
  ghiChu?: string | null;
}

export interface UpdateHangModelDto {
  tenHang: string;
  tenModel?: string | null;
  ghiChu?: string | null;
}

export interface DeleteHangModelResponseDto {
  message: string;
}
