export type NguoiDungRole = 'IT' | 'User';

export interface NguoiDungDto {
  id: number;
  name: string;
  username: string;
  email: string | null;
  phoneNumber: string | null;
  departmentId: number | null;
  isActive: boolean;
  role: NguoiDungRole;
}

export interface NguoiDungQueryDto {
  page?: number;
  limit?: number;
  role?: NguoiDungRole;
  departmentId?: number;
}

export interface NguoiDungListResponseDto {
  items: NguoiDungDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateNguoiDungDto {
  name: string;
  username: string;
  email?: string | null;
  phoneNumber?: string | null;
  departmentId?: number | null;
  role?: NguoiDungRole;
}

export interface UpdateNguoiDungDto {
  name: string;
  email?: string | null;
  phoneNumber?: string | null;
  departmentId?: number | null;
}

export interface SetNguoiDungRoleDto {
  role: NguoiDungRole;
}

export interface ActionMessageResponseDto {
  message: string;
}
