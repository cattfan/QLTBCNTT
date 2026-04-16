import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { BanGiaoResponseDto, CreateBanGiaoDto } from '@repo/shared';
import {
  BanGiaoActionResponseBody,
  CreateBanGiaoRequestBody,
} from './ban-giao.docs';
import { BanGiaoService } from './ban-giao.service';

@ApiTags('Ban giao')
@ApiBearerAuth('bearer')
@Controller('ban-giao')
export class BanGiaoController {
  constructor(private readonly banGiaoService: BanGiaoService) {}

  @ApiOperation({
    summary: 'Ban giao thiet bi cho nhan vien',
  })
  @ApiBody({ type: CreateBanGiaoRequestBody })
  @ApiOkResponse({ type: BanGiaoActionResponseBody })
  @ApiConflictResponse({
    description:
      'Thiet bi that lac, dang duoc nguoi khac muon hoac khong the cap nhat tinh trang',
  })
  @ApiNotFoundResponse({
    description: 'Khong tim thay thiet bi hoac nguoi nhan',
  })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Post()
  create(
    @Body() payload: CreateBanGiaoRequestBody,
  ): Promise<BanGiaoResponseDto> {
    return this.banGiaoService.create(payload as CreateBanGiaoDto);
  }
}
