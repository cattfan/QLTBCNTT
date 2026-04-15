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

export class PhanMemDietVirusQueryRequest {
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
    example: 'Kaspersky',
    description: 'Tim kiem theo ten phan mem diet virus',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreatePhanMemDietVirusRequestBody {
  @ApiProperty({
    example: 'Kaspersky',
    description: 'Ten phan mem diet virus',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tenPhanMem!: string;

  @ApiPropertyOptional({
    example: '2026',
    description: 'Phien ban phan mem',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  phienBan?: string | null;
}

export class UpdatePhanMemDietVirusRequestBody extends CreatePhanMemDietVirusRequestBody {}

export class PhanMemDietVirusResponseBody {
  @ApiProperty({
    example: 1,
    description: 'ID phan mem diet virus',
  })
  id!: number;

  @ApiProperty({
    example: 'Kaspersky',
    description: 'Ten phan mem diet virus',
  })
  tenPhanMem!: string;

  @ApiPropertyOptional({
    example: '2026',
    description: 'Phien ban phan mem',
    nullable: true,
  })
  phienBan!: string | null;
}

export class PhanMemDietVirusListResponseBody {
  @ApiProperty({
    type: [PhanMemDietVirusResponseBody],
    description: 'Danh sach phan mem diet virus',
  })
  items!: PhanMemDietVirusResponseBody[];

  @ApiProperty({
    example: 20,
    description: 'Tong so ban ghi',
  })
  total!: number;

  @ApiProperty({
    example: 1,
    description: 'Trang hien tai',
  })
  page!: number;

  @ApiProperty({
    example: 10,
    description: 'So ban ghi moi trang',
  })
  limit!: number;

  @ApiProperty({
    example: 2,
    description: 'Tong so trang',
  })
  totalPages!: number;
}

export class DeletePhanMemDietVirusResponseBody {
  @ApiProperty({
    example: 'Xoa phan mem diet virus thanh cong',
    description: 'Thong bao ket qua xoa',
  })
  message!: string;
}
