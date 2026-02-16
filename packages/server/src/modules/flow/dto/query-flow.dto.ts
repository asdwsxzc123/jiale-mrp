import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 流水通用查询 DTO - 三表共用的筛选条件
 */
export class QueryFlowDto {
  @ApiPropertyOptional({ description: '开始日期，格式 YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期，格式 YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: '客户 ID' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: '材料 ID' })
  @IsOptional()
  @IsString()
  stockItemId?: string;

  @ApiPropertyOptional({ description: '页码', default: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ description: '每页条数', default: '20' })
  @IsOptional()
  @IsString()
  pageSize?: string;
}
