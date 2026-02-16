import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建入库流水 DTO
 */
export class CreateInboundDto {
  @ApiProperty({ description: '日期，格式 YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: '序号' })
  @IsOptional() @IsString() serialNo?: string;

  @ApiPropertyOptional({ description: '柜号/车号' })
  @IsOptional() @IsString() containerNo?: string;

  @ApiProperty({ description: '货名' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiPropertyOptional({ description: '提单重量' })
  @IsOptional() @IsNumber() billWeight?: number;

  @ApiPropertyOptional({ description: '实际重量' })
  @IsOptional() @IsNumber() actualWeight?: number;

  @ApiPropertyOptional({ description: '仓库位置' })
  @IsOptional() @IsString() location?: string;

  @ApiPropertyOptional({ description: '实际总重' })
  @IsOptional() @IsNumber() totalWeight?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional() @IsString() remark?: string;

  @ApiPropertyOptional({ description: '重差' })
  @IsOptional() @IsNumber() weightDiff?: number;

  @ApiPropertyOptional({ description: '客户 ID' })
  @IsOptional() @IsString() customerId?: string;

  @ApiPropertyOptional({ description: '材料 ID' })
  @IsOptional() @IsString() stockItemId?: string;
}
