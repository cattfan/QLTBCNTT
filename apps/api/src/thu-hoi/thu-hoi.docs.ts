import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateThuHoiRequestBody {
  @ApiProperty({
    example: 1,
    description: 'ID thiết bị cần thu hồi',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  thietBiId!: number;

  @ApiPropertyOptional({
    example: 'Thu hồi về kho',
    description: 'Ghi chú thu hồi',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  ghiChu?: string | null;
}

export class ThuHoiResponseBody {
  @ApiProperty({ example: 1, description: 'ID bản ghi bàn giao' })
  id!: number;

  @ApiProperty({ example: 1, description: 'ID thiết bị' })
  thietBiId!: number;

  @ApiPropertyOptional({ example: 2, nullable: true })
  nguoiNhanId!: number | null;

  @ApiPropertyOptional({ example: 3, nullable: true })
  phongBanNhanId!: number | null;

  @ApiProperty({ example: '2026-04-16' })
  ngayBanGiao!: string;

  @ApiPropertyOptional({ example: '2026-04-20', nullable: true })
  ngayThuHoi!: string | null;

  @ApiPropertyOptional({ example: 'ban_giao', nullable: true })
  hinhThuc!: string | null;

  @ApiPropertyOptional({
    example: 'Bàn giao thiết bị cho nhân viên',
    nullable: true,
  })
  noiDung!: string | null;

  @ApiPropertyOptional({ example: 'Thu hồi về kho', nullable: true })
  ghiChu!: string | null;
}

export class ThuHoiActionResponseBody {
  @ApiProperty({
    example: 'Thu hoi thiet bi thanh cong',
    description: 'Thông báo kết quả',
  })
  message!: string;

  @ApiProperty({
    type: ThuHoiResponseBody,
    description: 'Thông tin bản ghi bàn giao vừa được thu hồi',
  })
  handover!: ThuHoiResponseBody;
}
