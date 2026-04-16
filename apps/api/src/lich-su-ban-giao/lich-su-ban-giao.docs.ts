import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { LichSuBanGiaoStatus } from '@repo/shared';

const HISTORY_STATUSES: LichSuBanGiaoStatus[] = ['dang_muon', 'da_tra'];

export class LichSuBanGiaoQueryRequest {
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
    example: 'nguyenvana',
    description: 'Ma nhan vien, map theo ten_dang_nhap trong schema hien tai',
  })
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @ApiPropertyOptional({
    example: 'TB-001',
    description: 'Ma thiet bi',
  })
  @IsOptional()
  @IsString()
  deviceCode?: string;

  @ApiPropertyOptional({
    example: 'dang_muon',
    description: 'Trang thai lich su',
    enum: HISTORY_STATUSES,
  })
  @IsOptional()
  @IsIn(HISTORY_STATUSES)
  status?: LichSuBanGiaoStatus;
}

export class LichSuBanGiaoResponseBody {
  @ApiProperty({ example: 1 })
  id!: number;
  @ApiProperty({ example: 1 })
  thietBiId!: number;
  @ApiProperty({ example: 'TB-001' })
  thietBiCode!: string;
  @ApiProperty({ example: 'Laptop Dell Latitude' })
  thietBiName!: string;
  @ApiProperty({ example: 2, nullable: true })
  nguoiNhanId!: number | null;
  @ApiProperty({ example: 'nguyenvana', nullable: true })
  employeeCode!: string | null;
  @ApiProperty({ example: 'Nguyen Van A', nullable: true })
  employeeName!: string | null;
  @ApiProperty({ example: 3, nullable: true })
  phongBanNhanId!: number | null;
  @ApiProperty({ example: '2026-04-16' })
  handoverDate!: string;
  @ApiProperty({ example: null, nullable: true })
  returnDate!: string | null;
  @ApiProperty({ example: 'dang_muon', enum: HISTORY_STATUSES })
  status!: LichSuBanGiaoStatus;
  @ApiProperty({ example: 'ban_giao', nullable: true })
  handoverType!: string | null;
  @ApiProperty({ example: 'Ban giao laptop cho nhan vien moi', nullable: true })
  content!: string | null;
  @ApiProperty({ example: 'Da tra ve kho', nullable: true })
  note!: string | null;
}

export class LichSuBanGiaoListResponseBody {
  @ApiProperty({ type: [LichSuBanGiaoResponseBody] })
  items!: LichSuBanGiaoResponseBody[];
  @ApiProperty({ example: 10 })
  total!: number;
  @ApiProperty({ example: 1 })
  page!: number;
  @ApiProperty({ example: 10 })
  limit!: number;
  @ApiProperty({ example: 1 })
  totalPages!: number;
}
