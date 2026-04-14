export interface HeDieuHanhDto {
  id: number;
  tenHeDieuHanh: string;
  phienBan: string | null;
}

export interface HeDieuHanhQueryDto {
  page?: number;
  limit?: number;
  search?: string;
}

export interface HeDieuHanhListResponseDto {
  items: HeDieuHanhDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateHeDieuHanhDto {
  tenHeDieuHanh: string;
  phienBan?: string | null;
}

export interface UpdateHeDieuHanhDto {
  tenHeDieuHanh: string;
  phienBan?: string | null;
}

export interface DeleteHeDieuHanhResponseDto {
  message: string;
}
