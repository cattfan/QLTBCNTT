export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthUserDto {
  id: number;
  name: string;
  username: string;
  email: string | null;
  role: string | null;
  departmentId: number | null;
}

export interface LoginResponseDto {
  accessToken: string;
  user: AuthUserDto;
}

export interface MeResponseDto {
  user: AuthUserDto;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponseDto {
  message: string;
}
