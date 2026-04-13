import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginRequestBody {
  @ApiProperty({
    example: 'admin',
    description: 'Ten dang nhap cua tai khoan',
  })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    example: 'P@ssw0rd',
    description: 'Mat khau dang nhap',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ChangePasswordRequestBody {
  @ApiProperty({
    example: 'OldP@ssw0rd',
    description: 'Mat khau hien tai',
  })
  @IsString()
  @IsNotEmpty()
  oldPassword!: string;

  @ApiProperty({
    example: 'NewP@ssw0rd',
    description: 'Mat khau moi',
  })
  @IsString()
  @IsNotEmpty()
  newPassword!: string;
}

export class AuthUserResponseBody {
  @ApiProperty({
    example: 1,
    description: 'ID tai khoan',
  })
  id!: number;

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

  @ApiProperty({
    example: 'admin@example.com',
    description: 'Email tai khoan',
    nullable: true,
  })
  email!: string | null;

  @ApiProperty({
    example: 'admin',
    description: 'Vai tro tai khoan',
    nullable: true,
  })
  role!: string | null;

  @ApiProperty({
    example: 2,
    description: 'ID phong ban',
    nullable: true,
  })
  departmentId!: number | null;
}

export class LoginResponseBody {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYWRtaW4ifQ.signature',
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
