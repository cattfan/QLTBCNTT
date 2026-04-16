export interface CreateBanGiaoDto {
  thietBiId: number;
  nguoiNhanId: number;
  hinhThuc?: string | null;
  noiDung?: string | null;
  ghiChu?: string | null;
}

export interface BanGiaoDto {
  id: number;
  thietBiId: number;
  nguoiNhanId: number | null;
  phongBanNhanId: number | null;
  ngayBanGiao: string;
  ngayThuHoi: string | null;
  hinhThuc: string | null;
  noiDung: string | null;
  ghiChu: string | null;
}

export interface BanGiaoResponseDto {
  message: string;
  handover: BanGiaoDto;
}
