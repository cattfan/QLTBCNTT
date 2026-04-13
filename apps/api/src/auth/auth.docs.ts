import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestBody {
  @ApiProperty({
    example: 'admin',
    description: 'Ten dang nhap cua tai khoan',
  })
  username!: string;

  @ApiProperty({
    example: 'P@ssw0rd',
    description: 'Mat khau dang nhap',
  })
  password!: string;
}

export class ChangePasswordRequestBody {
  @ApiProperty({
    example: 'OldP@ssw0rd',
    description: 'Mat khau hien tai',
  })
  oldPassword!: string;

  @ApiProperty({
    example: 'NewP@ssw0rd',
    description: 'Mat khau moi',
  })
  newPassword!: string;
}

export class AuthUserResponseBody {
  @ApiProperty({
    example: 'user-1',
    description: 'ID tai khoan',
  })
  id!: string;

  @ApiProperty({
    example: '2026-04-13T00:00:00.000Z',
    description: 'Thoi diem tao tai khoan',
  })
  createdAt!: string;

  @ApiProperty({
    example: 'Administrator',
    description: 'Ten hien thi',
  })
  name!: string;

  @ApiProperty({
    example: 'admin',
    description: 'Ten dang nhap',
  })
  username!: string;
}

export class LoginResponseBody {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJ1c2VybmFtZSI6ImFkbWluIn0.signature',
    description: 'JWT access token',
  })
  accessToken!: string;

  @ApiProperty({
    type: AuthUserResponseBody,
    description: 'Thong tin tai khoan dang nhap',
  })
  user!: AuthUserResponseBody;
}

export class MeResponseBody {
  @ApiProperty({
    type: AuthUserResponseBody,
    description: 'Thong tin nguoi dang dang nhap',
  })
  user!: AuthUserResponseBody;
}

export class ChangePasswordResponseBody {
  @ApiProperty({
    example: 'Password changed successfully',
    description: 'Thong bao ket qua doi mat khau',
  })
  message!: string;
}
