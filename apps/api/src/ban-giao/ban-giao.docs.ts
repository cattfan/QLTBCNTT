import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBanGiaoRequestBody {
  @ApiProperty({
    example: 1,
    description: 'ID thiết bị cần bàn giao',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  thietBiId!: number;

  @ApiProperty({
    example: 2,
    description: 'ID nhân viên nhận thiết bị',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  nguoiNhanId!: number;

  @ApiPropertyOptional({
    example: 'ban_giao',
    description: 'Hình thức bàn giao',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  hinhThuc?: string | null;

  @ApiPropertyOptional({
    example: 'Bàn giao thiết bị cho nhân viên mới',
    description: 'Nội dung bàn giao',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  noiDung?: string | null;

  @ApiPropertyOptional({
    example: 'Cấp cho phòng kinh doanh',
    description: 'Ghi chú thêm',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  ghiChu?: string | null;
}

export class BanGiaoResponseBody {
  @ApiProperty({ example: 1, description: 'ID bản ghi bàn giao' })
  id!: number;

  @ApiProperty({ example: 1, description: 'ID thiết bị' })
  thietBiId!: number;

  @ApiPropertyOptional({
    example: 2,
    nullable: true,
    description: 'ID người nhận',
  })
  nguoiNhanId!: number | null;

  @ApiPropertyOptional({
    example: 3,
    nullable: true,
    description: 'ID phòng ban nhận',
  })
  phongBanNhanId!: number | null;

  @ApiProperty({
    example: '2026-04-16',
    description: 'Ngày bàn giao',
  })
  ngayBanGiao!: string;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'Ngày thu hồi',
  })
  ngayThuHoi!: string | null;

  @ApiPropertyOptional({
    example: 'ban_giao',
    nullable: true,
    description: 'Hình thức bàn giao',
  })
  hinhThuc!: string | null;

  @ApiPropertyOptional({
    example: 'Bàn giao thiết bị cho nhân viên mới',
    nullable: true,
    description: 'Nội dung',
  })
  noiDung!: string | null;

  @ApiPropertyOptional({
    example: 'Cấp cho phòng kinh doanh',
    nullable: true,
    description: 'Ghi chú',
  })
  ghiChu!: string | null;
}

export class BanGiaoActionResponseBody {
  @ApiProperty({
    example: 'Ban giao thiet bi thanh cong',
    description: 'Thông báo kết quả',
  })
  message!: string;

  @ApiProperty({
    type: BanGiaoResponseBody,
    description: 'Thông tin bản ghi bàn giao vừa tạo',
  })
  handover!: BanGiaoResponseBody;
}
