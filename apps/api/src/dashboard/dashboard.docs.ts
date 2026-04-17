import { ApiProperty } from '@nestjs/swagger';
import type { DashboardRecentEventType } from '@repo/shared';

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
