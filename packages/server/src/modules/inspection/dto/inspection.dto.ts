import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** 创建来料检验 DTO */
export class CreateInspectionDto {
  @ApiProperty({ description: '采购单据 ID' })
  @IsString() @IsNotEmpty() purchaseDocId: string;

  @ApiPropertyOptional({ description: '采购单据明细 ID' })
  @IsOptional() @IsString() purchaseDocItemId?: string;

  @ApiProperty({ description: '物料 ID' })
  @IsString() @IsNotEmpty() itemId: string;

  @ApiProperty({ description: '供应商 ID' })
  @IsString() @IsNotEmpty() supplierId: string;

  @ApiProperty({ description: '检验日期' })
  @IsString() @IsNotEmpty() inspectionDate: string;

  @ApiPropertyOptional({ description: '错误物料' })
  @IsOptional() @IsBoolean() wrongItem?: boolean;

  @ApiPropertyOptional({ description: '错误物料描述' })
  @IsOptional() @IsString() wrongItemDescription?: string;

  @ApiPropertyOptional({ description: '重量差异' })
  @IsOptional() @IsNumber() weightDifference?: number;

  @ApiPropertyOptional({ description: '处理方式', enum: ['RETURN', 'REPLENISH', 'CONCESSION', 'SCRAP'] })
  @IsOptional() @IsEnum(['RETURN', 'REPLENISH', 'CONCESSION', 'SCRAP']) handlingMethod?: string;

  @ApiPropertyOptional({ description: '处理备注' })
  @IsOptional() @IsString() handlingNotes?: string;

  @ApiPropertyOptional({ description: '检验员 ID' })
  @IsOptional() @IsString() inspectorId?: string;
}

/** 检验合格时的额外数据 */
export class PassInspectionDto {
  @ApiProperty({ description: '重量' })
  @IsNumber() weight: number;

  @ApiPropertyOptional({ description: '重量单位', default: 'KG' })
  @IsOptional() @IsString() weightUnit?: string;

  @ApiPropertyOptional({ description: '仓位 ID' })
  @IsOptional() @IsString() warehouseLocationId?: string;
}
