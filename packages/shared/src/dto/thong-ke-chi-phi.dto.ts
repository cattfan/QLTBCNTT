export type CostTimeGranularity = 'month' | 'quarter' | 'year';

export interface CostStatsItemDto {
  key: string;
  label: string;
  totalCost: number;
}

export interface CostStatsResponseDto {
  items: CostStatsItemDto[];
}

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
