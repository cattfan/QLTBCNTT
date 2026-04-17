import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { CostByTimeResponseDto, CostStatsResponseDto } from '@repo/shared';
import {
  CostStatsResponseBody,
  ThongKeCostByTimeQueryRequest,
  ThongKeCostByTimeResponseBody,
} from './thong-ke-chi-phi.docs';
import { ThongKeChiPhiService } from './thong-ke-chi-phi.service';

@ApiTags('Thong ke chi phi')
@ApiBearerAuth('bearer')
@Controller('thong-ke-chi-phi')
export class ThongKeChiPhiController {
  constructor(private readonly thongKeChiPhiService: ThongKeChiPhiService) {}

  @ApiOperation({
    summary: 'Tinh tong chi phi sua chua theo loai thiet bi',
  })
  @ApiOkResponse({ type: CostStatsResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get('theo-loai-thiet-bi')
  byDeviceType(): Promise<CostStatsResponseDto> {
    return this.thongKeChiPhiService.byDeviceType();
  }

  @ApiOperation({
    summary: 'Tinh tong chi phi sua chua theo phong ban',
  })
  @ApiOkResponse({ type: CostStatsResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get('theo-phong-ban')
  byDepartment(): Promise<CostStatsResponseDto> {
    return this.thongKeChiPhiService.byDepartment();
  }

  @ApiOperation({
    summary: 'Tinh tong chi phi sua chua theo thoi gian',
  })
  @ApiQuery({
    name: 'granularity',
    required: true,
    type: String,
    example: 'month',
  })
  @ApiOkResponse({ type: ThongKeCostByTimeResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get('theo-thoi-gian')
  byTime(
    @Query() query: ThongKeCostByTimeQueryRequest,
  ): Promise<CostByTimeResponseDto> {
    return this.thongKeChiPhiService.byTime(query);
  }
}
