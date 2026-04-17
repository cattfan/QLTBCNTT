import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SuaChuaBaoTriStatus } from '@repo/shared';

const REPAIR_STATUSES: SuaChuaBaoTriStatus[] = ['dang_xu_ly', 'da_hoan_thanh'];

export class CreateSuaChuaBaoTriRequestBody {
  @ApiProperty({
    example: 1,
    description: 'ID thiết bị phát sinh sự cố',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  thietBiId!: number;

  @ApiProperty({
    example: 'Không lên nguồn',
    description: 'Mô tả lỗi',
  })
  @IsString()
  @MaxLength(1000)
  moTaLoi!: string;

  @ApiPropertyOptional({
    example: 'phần cứng',
    description: 'Loại xử lý/sự cố',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  loaiXuLy?: string | null;

  @ApiPropertyOptional({
    example: 'Trung tâm bảo hành Dell',
    description: 'Đơn vị sửa chữa',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  donViSuaChua?: string | null;

  @ApiPropertyOptional({
    example: 'Máy ngừng hoạt động từ sáng',
    description: 'Ghi chú thêm',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  ghiChu?: string | null;
}

export class CloseSuaChuaBaoTriRequestBody {
  @ApiProperty({
    example: 1500000,
    description: 'Chi phí thực tế',
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  chiPhi!: number;

  @ApiPropertyOptional({
    example: 'Đã thay nguồn và vệ sinh máy',
    description: 'Kết quả/cách khắc phục',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  ketQuaXuLy?: string | null;

  @ApiPropertyOptional({
    example: 'Hoàn thành trong ngày',
    description: 'Ghi chú đóng phiếu',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  ghiChu?: string | null;
}

export class SuaChuaBaoTriQueryRequest {
  @ApiPropertyOptional({
    example: 1,
    description: 'Trang hiện tại',
    minimum: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Số bản ghi mỗi trang',
    minimum: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    example: 'dang_xu_ly',
    description: 'Lọc theo trạng thái xử lý',
    enum: REPAIR_STATUSES,
  })
  @IsOptional()
  @IsIn(REPAIR_STATUSES)
  status?: SuaChuaBaoTriStatus;
}

export class SuaChuaBaoTriResponseBody {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  thietBiId!: number;

  @ApiProperty({ example: '2026-04-17' })
  ngayGhiNhan!: string;

  @ApiPropertyOptional({ example: null, nullable: true })
  ngaySuaChua!: string | null;

  @ApiPropertyOptional({ example: 'Không lên nguồn', nullable: true })
  moTaLoi!: string | null;

  @ApiPropertyOptional({ example: 'phần cứng', nullable: true })
  loaiXuLy!: string | null;

  @ApiPropertyOptional({
    example: 'Trung tâm bảo hành Dell',
    nullable: true,
  })
  donViSuaChua!: string | null;

  @ApiPropertyOptional({ example: 1500000, nullable: true })
  chiPhi!: number | null;

  @ApiPropertyOptional({
    example: 'Đã thay nguồn và vệ sinh máy',
    nullable: true,
  })
  ketQuaXuLy!: string | null;

  @ApiPropertyOptional({ example: 'Hoàn thành trong ngày', nullable: true })
  ghiChu!: string | null;

  @ApiProperty({ example: 'dang_xu_ly', enum: REPAIR_STATUSES })
  status!: SuaChuaBaoTriStatus;
}

export class SuaChuaBaoTriListResponseBody {
  @ApiProperty({ type: [SuaChuaBaoTriResponseBody] })
  items!: SuaChuaBaoTriResponseBody[];
  @ApiProperty({ example: 10 })
  total!: number;
  @ApiProperty({ example: 1 })
  page!: number;
  @ApiProperty({ example: 10 })
  limit!: number;
  @ApiProperty({ example: 1 })
  totalPages!: number;
}

export class SuaChuaBaoTriActionResponseBody {
  @ApiProperty({ example: 'Tao phieu sua chua thanh cong' })
  message!: string;

  @ApiProperty({ type: SuaChuaBaoTriResponseBody })
  ticket!: SuaChuaBaoTriResponseBody;
}
