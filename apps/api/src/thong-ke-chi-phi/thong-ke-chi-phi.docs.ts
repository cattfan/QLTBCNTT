import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { CostTimeGranularity } from '@repo/shared';

const COST_GRANULARITIES: CostTimeGranularity[] = ['month', 'quarter', 'year'];

export class CostByTimeQueryRequest {
  @ApiProperty({
    example: 'month',
    enum: COST_GRANULARITIES,
    description: 'Don vi thoi gian de gom nhom chi phi',
  })
  @IsIn(COST_GRANULARITIES)
  granularity!: CostTimeGranularity;
}

export class CostStatsItemResponseBody {
  @ApiProperty({ example: '1', description: 'Khoa nhom thong ke' })
  key!: string;

  @ApiProperty({ example: 'Laptop', description: 'Nhan hien thi' })
  label!: string;

  @ApiProperty({ example: 1500000, description: 'Tong chi phi sua chua' })
  totalCost!: number;
}

export class CostStatsResponseBody {
  @ApiProperty({
    type: [CostStatsItemResponseBody],
    description: 'Danh sach thong ke chi phi',
  })
  items!: CostStatsItemResponseBody[];
}

export class CostByTimeItemResponseBody {
  @ApiProperty({ example: '2026-04', description: 'Ky thong ke' })
  period!: string;

  @ApiProperty({ example: 2000000, description: 'Tong chi phi sua chua' })
  totalCost!: number;
}

export class CostByTimeResponseBody {
  @ApiProperty({
    example: 'month',
    enum: COST_GRANULARITIES,
    description: 'Don vi gom nhom',
  })
  granularity!: CostTimeGranularity;

  @ApiProperty({
    type: [CostByTimeItemResponseBody],
    description: 'Danh sach thong ke theo thoi gian',
  })
  items!: CostByTimeItemResponseBody[];
}
