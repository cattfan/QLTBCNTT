import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { LichSuBanGiaoListResponseDto } from '@repo/shared';
import {
  LichSuBanGiaoListResponseBody,
  LichSuBanGiaoQueryRequest,
} from './lich-su-ban-giao.docs';
import { LichSuBanGiaoService } from './lich-su-ban-giao.service';

@ApiTags('Lich su ban giao')
@ApiBearerAuth('bearer')
@Controller('lich-su-ban-giao')
export class LichSuBanGiaoController {
  constructor(private readonly lichSuBanGiaoService: LichSuBanGiaoService) {}

  @ApiOperation({
    summary: 'Lay danh sach lich su ban giao/thu hoi co phan trang va loc',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'employeeCode',
    required: false,
    type: String,
    example: 'nguyenvana',
  })
  @ApiQuery({
    name: 'deviceCode',
    required: false,
    type: String,
    example: 'TB-001',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    example: 'dang_muon',
  })
  @ApiOkResponse({ type: LichSuBanGiaoListResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get()
  findAll(
    @Query() query: LichSuBanGiaoQueryRequest,
  ): Promise<LichSuBanGiaoListResponseDto> {
    return this.lichSuBanGiaoService.findAll(query);
  }
}
