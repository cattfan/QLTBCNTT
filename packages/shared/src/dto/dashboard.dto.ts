export interface DashboardOverviewDto {
  totalDevices: number;
  inUseDevices: number;
  inStockDevices: number;
  inRepairDevices: number;
}

export interface DashboardDepartmentDistributionItemDto {
  departmentId: number;
  departmentName: string;
  totalDevices: number;
}

export interface DashboardDepartmentDistributionDto {
  items: DashboardDepartmentDistributionItemDto[];
}

export type DashboardRecentEventType = 'ban_giao' | 'thu_hoi' | 'bao_hong';

export interface DashboardRecentEventDto {
  eventType: DashboardRecentEventType;
  occurredAt: string;
  deviceId: number;
  deviceCode: string;
  deviceName: string;
  employeeId: number | null;
  employeeCode: string | null;
  employeeName: string | null;
  note: string | null;
}

export interface DashboardRecentEventsDto {
  items: DashboardRecentEventDto[];
}

export type CostTimeGranularity = 'month' | 'quarter' | 'year';

export interface CostByTimeItemDto {
  period: string;
  totalCost: number;
}

export interface CostByTimeResponseDto {
  granularity: CostTimeGranularity;
  items: CostByTimeItemDto[];
}

export interface CostByTimeQueryDto {
  granularity: CostTimeGranularity;
}
