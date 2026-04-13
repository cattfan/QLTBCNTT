export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthUserDto {
  id: string;
  createdAt: string;
  name: string;
  username: string;
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
