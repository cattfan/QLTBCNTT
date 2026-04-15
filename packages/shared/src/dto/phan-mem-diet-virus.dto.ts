export interface PhanMemDietVirusDto {
  id: number;
  tenPhanMem: string;
  phienBan: string | null;
}

export interface PhanMemDietVirusQueryDto {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PhanMemDietVirusListResponseDto {
  items: PhanMemDietVirusDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePhanMemDietVirusDto {
  tenPhanMem: string;
  phienBan?: string | null;
}

export interface UpdatePhanMemDietVirusDto {
  tenPhanMem: string;
  phienBan?: string | null;
}

export interface DeletePhanMemDietVirusResponseDto {
  message: string;
}
