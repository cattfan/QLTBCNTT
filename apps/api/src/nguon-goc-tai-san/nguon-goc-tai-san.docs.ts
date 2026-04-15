import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NguonGocTaiSanQueryRequest {
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
    example: 'ngan sach',
    description: 'Tìm kiếm theo mã hoặc tên nguồn gốc tài sản',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateNguonGocTaiSanRequestBody {
  @ApiPropertyOptional({
    example: 'NSNN',
    description: 'Mã nguồn gốc tài sản',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  maNguonGoc?: string | null;

  @ApiProperty({
    example: 'Ngân sách nhà nước',
    description: 'Tên nguồn gốc tài sản',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tenNguonGoc!: string;

  @ApiPropertyOptional({
    example: 'Nguồn kinh phí cấp phát',
    description: 'Ghi chú thêm',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  ghiChu?: string | null;
}

export class UpdateNguonGocTaiSanRequestBody extends CreateNguonGocTaiSanRequestBody {}

export class NguonGocTaiSanResponseBody {
  @ApiProperty({
    example: 1,
    description: 'ID nguồn gốc tài sản',
  })
  id!: number;

  @ApiPropertyOptional({
    example: 'NSNN',
    description: 'Mã nguồn gốc tài sản',
    nullable: true,
  })
  maNguonGoc!: string | null;

  @ApiProperty({
    example: 'Ngân sách nhà nước',
    description: 'Tên nguồn gốc tài sản',
  })
  tenNguonGoc!: string;

  @ApiPropertyOptional({
    example: 'Nguồn kinh phí cấp phát',
    description: 'Ghi chú thêm',
    nullable: true,
  })
  ghiChu!: string | null;
}

export class NguonGocTaiSanListResponseBody {
  @ApiProperty({
    type: [NguonGocTaiSanResponseBody],
    description: 'Danh sách nguồn gốc tài sản',
  })
  items!: NguonGocTaiSanResponseBody[];

  @ApiProperty({
    example: 10,
    description: 'Tổng số bản ghi',
  })
  total!: number;

  @ApiProperty({
    example: 1,
    description: 'Trang hiện tại',
  })
  page!: number;

  @ApiProperty({
    example: 10,
    description: 'Số bản ghi mỗi trang',
  })
  limit!: number;

  @ApiProperty({
    example: 1,
    description: 'Tổng số trang',
  })
  totalPages!: number;
}

export class DeleteNguonGocTaiSanResponseBody {
  @ApiProperty({
    example: 'Xóa nguồn gốc tài sản thành công',
    description: 'Thông báo kết quả xóa',
  })
  message!: string;
}
