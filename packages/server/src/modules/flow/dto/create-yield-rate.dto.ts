import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建出成率 DTO
 */
export class CreateYieldRateDto {
  @ApiProperty({ description: '日期，格式 YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: '货名' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiPropertyOptional({ description: '柜号/车号' })
  @IsOptional() @IsString() containerNo?: string;

  @ApiPropertyOptional({ description: '来货重量' })
  @IsOptional() @IsNumber() incomingWeight?: number;

  @ApiPropertyOptional({ description: '步骤' })
  @IsOptional() @IsString() step?: string;

  @ApiPropertyOptional({ description: '颗粒名称' })
  @IsOptional() @IsString() pelletName?: string;

  @ApiPropertyOptional({ description: '重量' })
  @IsOptional() @IsNumber() weight?: number;

  @ApiPropertyOptional({ description: '色母' })
  @IsOptional() @IsNumber() colorMaster?: number;

  @ApiPropertyOptional({ description: '太空袋' })
  @IsOptional() @IsNumber() spaceBag?: number;

  @ApiPropertyOptional({ description: '杂料' })
  @IsOptional() @IsNumber() misc?: number;

  @ApiPropertyOptional({ description: '胶头/杂料' })
  @IsOptional() @IsNumber() glueHeadMisc?: number;

  @ApiPropertyOptional({ description: '垃圾' })
  @IsOptional() @IsNumber() waste?: number;

  @ApiPropertyOptional({ description: '卡板' })
  @IsOptional() @IsNumber() pallet?: number;

  @ApiPropertyOptional({ description: '总重量' })
  @IsOptional() @IsNumber() totalWeight?: number;

  @ApiPropertyOptional({ description: '出成率' })
  @IsOptional() @IsNumber() yieldRateVal?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional() @IsString() remark?: string;

  @ApiPropertyOptional({ description: '客户 ID' })
  @IsOptional() @IsString() customerId?: string;

  @ApiPropertyOptional({ description: '材料 ID' })
  @IsOptional() @IsString() stockItemId?: string;
}
