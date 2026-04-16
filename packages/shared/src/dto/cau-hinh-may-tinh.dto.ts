export interface CauHinhMayTinhDto {
  id: number;
  thietBiId: number;
  mainboard: string | null;
  cpu: string | null;
  ram: string | null;
  oCung: string | null;
  heDieuHanhId: number | null;
  manHinh: string | null;
  phanMemDietVirusId: number | null;
  ghiChu: string | null;
}

export interface UpsertCauHinhMayTinhDto {
  mainboard?: string | null;
  cpu?: string | null;
  ram?: string | null;
  oCung?: string | null;
  heDieuHanhId?: number | null;
  manHinh?: string | null;
  phanMemDietVirusId?: number | null;
  ghiChu?: string | null;
}
