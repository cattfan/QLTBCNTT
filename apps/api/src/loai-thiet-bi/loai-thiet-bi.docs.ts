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

export class LoaiThietBiQueryRequest {
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
    example: 'Laptop',
    description: 'Tìm kiếm theo tên loại thiết bị',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateLoaiThietBiRequestBody {
  @ApiProperty({
    example: 'LT-LAPTOP',
    description: 'Mã danh mục loại thiết bị',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  maLoai!: string;

  @ApiProperty({
    example: 'Laptop',
    description: 'Tên loại thiết bị',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tenLoai!: string;

  @ApiPropertyOptional({
    example: 'Thiết bị máy tính xách tay',
    description: 'Ghi chú thêm',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  ghiChu?: string | null;
}

export class UpdateLoaiThietBiRequestBody extends CreateLoaiThietBiRequestBody {}

export class LoaiThietBiResponseBody {
  @ApiProperty({
    example: 1,
    description: 'ID loại thiết bị',
  })
  id!: number;

  @ApiProperty({
    example: 'LT-LAPTOP',
    description: 'Mã danh mục loại thiết bị',
  })
  maLoai!: string;

  @ApiProperty({
    example: 'Laptop',
    description: 'Tên loại thiết bị',
  })
  tenLoai!: string;

  @ApiPropertyOptional({
    example: 'Thiết bị máy tính xách tay',
    description: 'Ghi chú thêm',
    nullable: true,
  })
  ghiChu!: string | null;
}

export class LoaiThietBiListResponseBody {
  @ApiProperty({
    type: [LoaiThietBiResponseBody],
    description: 'Danh sách loại thiết bị',
  })
  items!: LoaiThietBiResponseBody[];

  @ApiProperty({
    example: 20,
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
    example: 2,
    description: 'Tổng số trang',
  })
  totalPages!: number;
}

export class DeleteLoaiThietBiResponseBody {
  @ApiProperty({
    example: 'Xóa loại thiết bị thành công',
    description: 'Thông báo kết quả xóa',
  })
  message!: string;
}
