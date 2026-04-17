import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type {
  CostByTimeResponseDto,
  DashboardDepartmentDistributionDto,
  DashboardOverviewDto,
  DashboardRecentEventsDto,
} from '@repo/shared';
import {
  CostByTimeQueryRequest,
  CostByTimeResponseBody,
  DashboardDepartmentDistributionResponseBody,
  DashboardOverviewResponseBody,
  DashboardRecentEventsResponseBody,
} from './dashboard.docs';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('bearer')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({ summary: 'Lay 4 so tong quan cua dashboard' })
  @ApiOkResponse({ type: DashboardOverviewResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get('overview')
  getOverview(): Promise<DashboardOverviewDto> {
    return this.dashboardService.getOverview();
  }

  @ApiOperation({
    summary: 'Lay du lieu bieu do phan bo thiet bi theo phong ban',
  })
  @ApiOkResponse({ type: DashboardDepartmentDistributionResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get('device-distribution-by-department')
  getDepartmentDistribution(): Promise<DashboardDepartmentDistributionDto> {
    return this.dashboardService.getDepartmentDistribution();
  }

  @ApiOperation({
    summary: 'Lay 10 su kien gan nhat: ban giao, thu hoi, bao hong',
  })
  @ApiOkResponse({ type: DashboardRecentEventsResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get('recent-events')
  getRecentEvents(): Promise<DashboardRecentEventsDto> {
    return this.dashboardService.getRecentEvents();
  }

  @ApiOperation({ summary: 'Tinh tong chi phi sua chua theo thoi gian' })
  @ApiQuery({
    name: 'granularity',
    required: true,
    type: String,
    example: 'month',
  })
  @ApiOkResponse({ type: CostByTimeResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get('repair-cost-by-time')
  getRepairCostByTime(
    @Query() query: CostByTimeQueryRequest,
  ): Promise<CostByTimeResponseDto> {
    return this.dashboardService.byTime(query);
  }
}
