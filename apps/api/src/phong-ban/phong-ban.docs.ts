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

export class PhongBanQueryRequest {
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
    example: 'KT',
    description: 'Tìm kiếm theo mã hoặc tên phòng ban',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreatePhongBanRequestBody {
  @ApiProperty({
    example: 'PB-KT',
    description: 'Mã phòng ban',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  maPhongBan!: string;

  @ApiProperty({
    example: 'Phòng Kế toán',
    description: 'Tên phòng ban',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tenPhongBan!: string;

  @ApiPropertyOptional({
    example: 'Phụ trách nghiệp vụ tài chính',
    description: 'Ghi chú thêm',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  ghiChu?: string | null;
}

export class UpdatePhongBanRequestBody extends CreatePhongBanRequestBody {}

export class PhongBanResponseBody {
  @ApiProperty({
    example: 1,
    description: 'ID phòng ban',
  })
  id!: number;

  @ApiProperty({
    example: 'PB-KT',
    description: 'Mã phòng ban',
  })
  maPhongBan!: string;

  @ApiProperty({
    example: 'Phòng Kế toán',
    description: 'Tên phòng ban',
  })
  tenPhongBan!: string;

  @ApiPropertyOptional({
    example: 'Phụ trách nghiệp vụ tài chính',
    description: 'Ghi chú thêm',
    nullable: true,
  })
  ghiChu!: string | null;
}

export class PhongBanListResponseBody {
  @ApiProperty({
    type: [PhongBanResponseBody],
    description: 'Danh sách phòng ban',
  })
  items!: PhongBanResponseBody[];

  @ApiProperty({
    example: 25,
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
    example: 3,
    description: 'Tổng số trang',
  })
  totalPages!: number;
}

export class DeletePhongBanResponseBody {
  @ApiProperty({
    example: 'Xóa phòng ban thành công',
    description: 'Thông báo kết quả xóa',
  })
  message!: string;
}
