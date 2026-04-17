import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const EXCEL_REPORT_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const PDF_REPORT_CONTENT_TYPE = 'application/pdf';
export const BINARY_FILE_SCHEMA = {
  type: 'string',
  format: 'binary',
} as const;

export class ExportThietBiReportQueryRequest {
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
