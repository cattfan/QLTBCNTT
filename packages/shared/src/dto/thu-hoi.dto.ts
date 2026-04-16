export interface CreateThuHoiDto {
  thietBiId: number;
  ghiChu?: string | null;
}

export interface ThuHoiDto {
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

export interface ThuHoiResponseDto {
  message: string;
  handover: ThuHoiDto;
}
