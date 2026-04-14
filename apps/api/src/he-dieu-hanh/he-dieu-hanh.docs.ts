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

export class HeDieuHanhQueryRequest {
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
    example: 'Windows',
    description: 'Tìm kiếm theo tên hệ điều hành',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateHeDieuHanhRequestBody {
  @ApiProperty({
    example: 'Windows',
    description: 'Tên hệ điều hành',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tenHeDieuHanh!: string;

  @ApiPropertyOptional({
    example: '11 Pro',
    description: 'Phiên bản hệ điều hành',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  phienBan?: string | null;
}

export class UpdateHeDieuHanhRequestBody extends CreateHeDieuHanhRequestBody {}

export class HeDieuHanhResponseBody {
  @ApiProperty({
    example: 1,
    description: 'ID hệ điều hành',
  })
  id!: number;

  @ApiProperty({
    example: 'Windows',
    description: 'Tên hệ điều hành',
  })
  tenHeDieuHanh!: string;

  @ApiPropertyOptional({
    example: '11 Pro',
    description: 'Phiên bản hệ điều hành',
    nullable: true,
  })
  phienBan!: string | null;
}

export class HeDieuHanhListResponseBody {
  @ApiProperty({
    type: [HeDieuHanhResponseBody],
    description: 'Danh sách hệ điều hành',
  })
  items!: HeDieuHanhResponseBody[];

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

export class DeleteHeDieuHanhResponseBody {
  @ApiProperty({
    example: 'Xóa hệ điều hành thành công',
    description: 'Thông báo kết quả xóa',
  })
  message!: string;
}
