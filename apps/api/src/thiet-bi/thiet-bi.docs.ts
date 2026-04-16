import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ThietBiQueryRequest {
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
    example: 'DELL',
    description: 'Tim kiem theo ma, ten hoac serial thiet bi',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 2, description: 'Loc theo phong ban' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  phongBanId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Loc theo tinh trang' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  tinhTrangId?: number;

  @ApiPropertyOptional({ example: 3, description: 'Loc theo loai thiet bi' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  loaiThietBiId?: number;
}

export class CreateThietBiRequestBody {
  @ApiProperty({ example: 'TB-001', description: 'Ma thiet bi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  maThietBi!: string;

  @ApiProperty({ example: 'Laptop Dell Latitude', description: 'Ten thiet bi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tenThietBi!: string;

  @ApiPropertyOptional({
    example: 'SN-001',
    description: 'Serial thiet bi',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  serial?: string | null;

  @ApiProperty({ example: 1, description: 'ID loai thiet bi' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  loaiThietBiId!: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'ID hang/model',
    nullable: true,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  hangModelId?: number | null;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID nguon goc',
    nullable: true,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  nguonGocId?: number | null;

  @ApiPropertyOptional({
    example: 3,
    description: 'ID phong ban',
    nullable: true,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  phongBanId?: number | null;

  @ApiPropertyOptional({
    example: 5,
    description: 'ID nguoi su dung',
    nullable: true,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  nguoiSuDungId?: number | null;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID tinh trang',
    nullable: true,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  tinhTrangId?: number | null;

  @ApiPropertyOptional({
    example: 2025,
    description: 'Nam trang bi',
    nullable: true,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1900)
  namTrangBi?: number | null;

  @ApiPropertyOptional({
    example: '2026-04-16',
    description: 'Ngay tiep nhan',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  ngayTiepNhan?: string | null;

  @ApiPropertyOptional({
    example: false,
    description: 'Danh dau thiet bi dung chung',
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  laThietBiDungChung?: boolean | null;

  @ApiPropertyOptional({
    example: false,
    description: 'Danh dau thiet bi mat',
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  thietBiMat?: boolean | null;

  @ApiPropertyOptional({
    example: 'May van phong tang 3',
    description: 'Ghi chu them',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  ghiChu?: string | null;
}

export class UpdateThietBiRequestBody extends CreateThietBiRequestBody {}

export class ThietBiResponseBody {
  @ApiProperty({ example: 1, description: 'ID thiet bi' })
  id!: number;
  @ApiProperty({ example: 'TB-001', description: 'Ma thiet bi' })
  maThietBi!: string;
  @ApiProperty({ example: 'Laptop Dell Latitude', description: 'Ten thiet bi' })
  tenThietBi!: string;
  @ApiPropertyOptional({ example: 'SN-001', nullable: true })
  serial!: string | null;
  @ApiProperty({ example: 1, description: 'ID loai thiet bi' })
  loaiThietBiId!: number;
  @ApiPropertyOptional({ example: 2, nullable: true })
  hangModelId!: number | null;
  @ApiPropertyOptional({ example: 1, nullable: true })
  nguonGocId!: number | null;
  @ApiPropertyOptional({ example: 3, nullable: true })
  phongBanId!: number | null;
  @ApiPropertyOptional({ example: 5, nullable: true })
  nguoiSuDungId!: number | null;
  @ApiPropertyOptional({ example: 1, nullable: true })
  tinhTrangId!: number | null;
  @ApiPropertyOptional({ example: 2025, nullable: true })
  namTrangBi!: number | null;
  @ApiPropertyOptional({ example: '2026-04-16', nullable: true })
  ngayTiepNhan!: string | null;
  @ApiPropertyOptional({ example: false, nullable: true })
  laThietBiDungChung!: boolean | null;
  @ApiPropertyOptional({ example: false, nullable: true })
  thietBiMat!: boolean | null;
  @ApiPropertyOptional({ example: 'May van phong tang 3', nullable: true })
  ghiChu!: string | null;
}

export class ThietBiListResponseBody {
  @ApiProperty({ type: [ThietBiResponseBody] })
  items!: ThietBiResponseBody[];
  @ApiProperty({ example: 10 })
  total!: number;
  @ApiProperty({ example: 1 })
  page!: number;
  @ApiProperty({ example: 10 })
  limit!: number;
  @ApiProperty({ example: 1 })
  totalPages!: number;
}

export class DeleteThietBiResponseBody {
  @ApiProperty({
    example: 'Xoa thiet bi thanh cong',
    description: 'Thong bao ket qua xoa',
  })
  message!: string;
}
