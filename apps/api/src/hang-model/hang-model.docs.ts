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

export class HangModelQueryRequest {
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
    example: 'Dell',
    description: 'Tìm kiếm theo tên hãng hoặc model',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateHangModelRequestBody {
  @ApiProperty({
    example: 'Dell',
    description: 'Tên hãng sản xuất',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tenHang!: string;

  @ApiPropertyOptional({
    example: 'Latitude 7420',
    description: 'Tên model thiết bị',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tenModel?: string | null;

  @ApiPropertyOptional({
    example: 'Dòng laptop doanh nghiệp',
    description: 'Ghi chú thêm',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  ghiChu?: string | null;
}

export class UpdateHangModelRequestBody extends CreateHangModelRequestBody {}

export class HangModelResponseBody {
  @ApiProperty({
    example: 1,
    description: 'ID hãng/model',
  })
  id!: number;

  @ApiProperty({
    example: 'Dell',
    description: 'Tên hãng sản xuất',
  })
  tenHang!: string;

  @ApiPropertyOptional({
    example: 'Latitude 7420',
    description: 'Tên model thiết bị',
    nullable: true,
  })
  tenModel!: string | null;

  @ApiPropertyOptional({
    example: 'Dòng laptop doanh nghiệp',
    description: 'Ghi chú thêm',
    nullable: true,
  })
  ghiChu!: string | null;
}

export class HangModelListResponseBody {
  @ApiProperty({
    type: [HangModelResponseBody],
    description: 'Danh sách hãng/model',
  })
  items!: HangModelResponseBody[];

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

export class DeleteHangModelResponseBody {
  @ApiProperty({
    example: 'Xóa hãng/model thành công',
    description: 'Thông báo kết quả xóa',
  })
  message!: string;
}
