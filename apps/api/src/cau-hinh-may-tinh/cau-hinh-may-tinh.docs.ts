import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertCauHinhMayTinhRequestBody {
  @ApiPropertyOptional({
    example: 'Dell 0X123',
    description: 'Mainboard',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  mainboard?: string | null;

  @ApiPropertyOptional({
    example: 'Intel Core i7-1360P',
    description: 'CPU',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  cpu?: string | null;

  @ApiPropertyOptional({
    example: '16GB DDR5',
    description: 'RAM',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ram?: string | null;

  @ApiPropertyOptional({
    example: '512GB SSD',
    description: 'Ổ cứng',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  oCung?: string | null;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID hệ điều hành',
    nullable: true,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  heDieuHanhId?: number | null;

  @ApiPropertyOptional({
    example: '14 inch FHD',
    description: 'Màn hình',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  manHinh?: string | null;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID phần mềm diệt virus',
    nullable: true,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  phanMemDietVirusId?: number | null;

  @ApiPropertyOptional({
    example: 'Máy cấu hình chuẩn văn phòng',
    description: 'Ghi chú thêm',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  ghiChu?: string | null;
}

export class CauHinhMayTinhResponseBody {
  @ApiProperty({ example: 1, description: 'ID cấu hình' })
  id!: number;

  @ApiProperty({ example: 10, description: 'ID thiết bị' })
  thietBiId!: number;

  @ApiPropertyOptional({ example: 'Dell 0X123', nullable: true })
  mainboard!: string | null;

  @ApiPropertyOptional({ example: 'Intel Core i7-1360P', nullable: true })
  cpu!: string | null;

  @ApiPropertyOptional({ example: '16GB DDR5', nullable: true })
  ram!: string | null;

  @ApiPropertyOptional({ example: '512GB SSD', nullable: true })
  oCung!: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  heDieuHanhId!: number | null;

  @ApiPropertyOptional({ example: '14 inch FHD', nullable: true })
  manHinh!: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  phanMemDietVirusId!: number | null;

  @ApiPropertyOptional({
    example: 'Máy cấu hình chuẩn văn phòng',
    nullable: true,
  })
  ghiChu!: string | null;
}
