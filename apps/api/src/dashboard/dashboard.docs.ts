import { ApiProperty } from '@nestjs/swagger';
import type {
  CostTimeGranularity,
  DashboardRecentEventType,
} from '@repo/shared';
import { IsIn } from 'class-validator';

export class DashboardOverviewResponseBody {
  @ApiProperty({ example: 120 })
  totalDevices!: number;

  @ApiProperty({ example: 60 })
  inUseDevices!: number;

  @ApiProperty({ example: 40 })
  inStockDevices!: number;

  @ApiProperty({ example: 5 })
  inRepairDevices!: number;
}

export class DashboardDepartmentDistributionItemResponseBody {
  @ApiProperty({ example: 2 })
  departmentId!: number;

  @ApiProperty({ example: 'Phong CNTT' })
  departmentName!: string;

  @ApiProperty({ example: 25 })
  totalDevices!: number;
}

export class DashboardDepartmentDistributionResponseBody {
  @ApiProperty({ type: [DashboardDepartmentDistributionItemResponseBody] })
  items!: DashboardDepartmentDistributionItemResponseBody[];
}

export class DashboardRecentEventResponseBody {
  @ApiProperty({ enum: ['ban_giao', 'thu_hoi', 'bao_hong'] })
  eventType!: DashboardRecentEventType;

  @ApiProperty({ example: '2026-04-17' })
  occurredAt!: string;

  @ApiProperty({ example: 1 })
  deviceId!: number;

  @ApiProperty({ example: 'TB-001' })
  deviceCode!: string;

  @ApiProperty({ example: 'Laptop Dell Latitude' })
  deviceName!: string;

  @ApiProperty({ example: 2, nullable: true })
  employeeId!: number | null;

  @ApiProperty({ example: 'nguyenvana', nullable: true })
  employeeCode!: string | null;

  @ApiProperty({ example: 'Nguyen Van A', nullable: true })
  employeeName!: string | null;

  @ApiProperty({ example: 'Ban giao laptop cho nhan vien moi', nullable: true })
  note!: string | null;
}

export class DashboardRecentEventsResponseBody {
  @ApiProperty({ type: [DashboardRecentEventResponseBody] })
  items!: DashboardRecentEventResponseBody[];
}

const COST_GRANULARITIES: CostTimeGranularity[] = ['month', 'quarter', 'year'];

export class CostByTimeQueryRequest {
  @ApiProperty({
    example: 'month',
    enum: COST_GRANULARITIES,
    description: 'Don vi gom nhom thoi gian',
  })
  @IsIn(COST_GRANULARITIES)
  granularity!: CostTimeGranularity;
}

export class CostByTimeItemResponseBody {
  @ApiProperty({ example: '2026-04' })
  period!: string;

  @ApiProperty({ example: 1500000 })
  totalCost!: number;
}

export class CostByTimeResponseBody {
  @ApiProperty({
    example: 'month',
    enum: COST_GRANULARITIES,
  })
  granularity!: CostTimeGranularity;

  @ApiProperty({ type: [CostByTimeItemResponseBody] })
  items!: CostByTimeItemResponseBody[];
}
