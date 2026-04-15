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

export class TinhTrangThietBiQueryRequest {
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
    example: 'su dung',
    description: 'Tìm kiếm theo tên tình trạng thiết bị',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateTinhTrangThietBiRequestBody {
  @ApiPropertyOptional({
    example: 'DANG_SU_DUNG',
    description: 'Mã tình trạng thiết bị',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  maTinhTrang?: string | null;

  @ApiProperty({
    example: 'Đang sử dụng',
    description: 'Tên tình trạng thiết bị',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tenTinhTrang!: string;

  @ApiPropertyOptional({
    example: 'Thiết bị đang được bàn giao sử dụng',
    description: 'Ghi chú thêm',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  ghiChu?: string | null;
}

export class UpdateTinhTrangThietBiRequestBody extends CreateTinhTrangThietBiRequestBody {}

export class TinhTrangThietBiResponseBody {
  @ApiProperty({
    example: 1,
    description: 'ID tình trạng thiết bị',
  })
  id!: number;

  @ApiPropertyOptional({
    example: 'DANG_SU_DUNG',
    description: 'Mã tình trạng thiết bị',
    nullable: true,
  })
  maTinhTrang!: string | null;

  @ApiProperty({
    example: 'Đang sử dụng',
    description: 'Tên tình trạng thiết bị',
  })
  tenTinhTrang!: string;

  @ApiPropertyOptional({
    example: 'Thiết bị đang được bàn giao sử dụng',
    description: 'Ghi chú thêm',
    nullable: true,
  })
  ghiChu!: string | null;
}

export class TinhTrangThietBiListResponseBody {
  @ApiProperty({
    type: [TinhTrangThietBiResponseBody],
    description: 'Danh sách tình trạng thiết bị',
  })
  items!: TinhTrangThietBiResponseBody[];

  @ApiProperty({
    example: 3,
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

export class DeleteTinhTrangThietBiResponseBody {
  @ApiProperty({
    example: 'Xóa tình trạng thiết bị thành công',
    description: 'Thông báo kết quả xóa',
  })
  message!: string;
}
