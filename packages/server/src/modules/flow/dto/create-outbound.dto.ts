import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建出库流水 DTO
 */
export class CreateOutboundDto {
  @ApiProperty({ description: '日期，格式 YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: '序号' })
  @IsOptional() @IsString() serialNo?: string;

  @ApiPropertyOptional({ description: '归属' })
  @IsOptional() @IsString() belonging?: string;

  @ApiPropertyOptional({ description: '柜号' })
  @IsOptional() @IsString() containerNo?: string;

  @ApiProperty({ description: '品名' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiPropertyOptional({ description: '重量' })
  @IsOptional() @IsNumber() weight?: number;

  @ApiPropertyOptional({ description: '包数' })
  @IsOptional() @IsInt() packageCount?: number;

  @ApiPropertyOptional({ description: '总重' })
  @IsOptional() @IsNumber() totalWeight?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional() @IsString() remark?: string;

  @ApiPropertyOptional({ description: '客户 ID' })
  @IsOptional() @IsString() customerId?: string;

  @ApiPropertyOptional({ description: '材料 ID' })
  @IsOptional() @IsString() stockItemId?: string;
}
