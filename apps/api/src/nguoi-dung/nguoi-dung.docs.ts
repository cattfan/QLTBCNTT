import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { NguoiDungRole } from '@repo/shared';

const USER_ROLES: NguoiDungRole[] = ['IT', 'User'];

export class NguoiDungQueryRequest {
  @ApiPropertyOptional({
    example: 1,
    description: 'Trang hien tai',
    minimum: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'So ban ghi moi trang',
    minimum: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    example: 'IT',
    description: 'Loc theo chuc vu',
    enum: USER_ROLES,
  })
  @IsOptional()
  @IsIn(USER_ROLES)
  role?: NguoiDungRole;

  @ApiPropertyOptional({
    example: 2,
    description: 'Loc theo ID phong ban',
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  departmentId?: number;
}

export class CreateNguoiDungRequestBody {
  @ApiProperty({
    example: 'Nguyen Van A',
    description: 'Ho ten nhan vien',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    example: 'nguyenvana',
    description: 'Ten dang nhap',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username!: string;

  @ApiPropertyOptional({
    example: 'a@example.com',
    description: 'Email tai khoan',
    nullable: true,
  })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({
    example: '0901234567',
    description: 'So dien thoai',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string | null;

  @ApiPropertyOptional({
    example: 2,
    description: 'ID phong ban',
    nullable: true,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  departmentId?: number | null;

  @ApiPropertyOptional({
    example: 'User',
    description: 'Vai tro tai khoan',
    enum: USER_ROLES,
  })
  @IsOptional()
  @IsIn(USER_ROLES)
  role?: NguoiDungRole;
}

export class UpdateNguoiDungRequestBody {
  @ApiProperty({
    example: 'Nguyen Van A',
    description: 'Ho ten nhan vien',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    example: 'a@example.com',
    description: 'Email tai khoan',
    nullable: true,
  })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({
    example: '0901234567',
    description: 'So dien thoai',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string | null;

  @ApiPropertyOptional({
    example: 2,
    description: 'ID phong ban',
    nullable: true,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  departmentId?: number | null;
}

export class SetNguoiDungRoleRequestBody {
  @ApiProperty({
    example: 'IT',
    description: 'Vai tro can gan',
    enum: USER_ROLES,
  })
  @IsIn(USER_ROLES)
  role!: NguoiDungRole;
}

export class NguoiDungResponseBody {
  @ApiProperty({ example: 1, description: 'ID tai khoan' })
  id!: number;

  @ApiProperty({ example: 'Nguyen Van A', description: 'Ho ten nhan vien' })
  name!: string;

  @ApiProperty({ example: 'nguyenvana', description: 'Ten dang nhap' })
  username!: string;

  @ApiPropertyOptional({
    example: 'a@example.com',
    description: 'Email tai khoan',
    nullable: true,
  })
  email!: string | null;

  @ApiPropertyOptional({
    example: '0901234567',
    description: 'So dien thoai',
    nullable: true,
  })
  phoneNumber!: string | null;

  @ApiPropertyOptional({
    example: 2,
    description: 'ID phong ban',
    nullable: true,
  })
  departmentId!: number | null;

  @ApiProperty({
    example: true,
    description: 'Trang thai hoat dong cua tai khoan',
  })
  isActive!: boolean;

  @ApiProperty({
    example: 'User',
    description: 'Vai tro tai khoan',
    enum: USER_ROLES,
  })
  role!: NguoiDungRole;
}

export class NguoiDungListResponseBody {
  @ApiProperty({
    type: [NguoiDungResponseBody],
    description: 'Danh sach tai khoan',
  })
  items!: NguoiDungResponseBody[];

  @ApiProperty({ example: 20, description: 'Tong so ban ghi' })
  total!: number;

  @ApiProperty({ example: 1, description: 'Trang hien tai' })
  page!: number;

  @ApiProperty({ example: 10, description: 'So ban ghi moi trang' })
  limit!: number;

  @ApiProperty({ example: 2, description: 'Tong so trang' })
  totalPages!: number;
}

export class ActionMessageResponseBody {
  @ApiProperty({
    example: 'Thuc hien thanh cong',
    description: 'Thong bao ket qua thao tac',
  })
  message!: string;
}
