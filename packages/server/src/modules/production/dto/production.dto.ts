import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/** BOM 明细行 DTO */
export class BOMItemDto {
  @ApiProperty({ description: '原材料物料 ID' })
  @IsString() @IsNotEmpty() materialItemId: string;

  @ApiProperty({ description: '数量' })
  @IsNumber() quantity: number;

  @ApiProperty({ description: '单位' })
  @IsString() @IsNotEmpty() uom: string;

  @ApiPropertyOptional({ description: '是否子装配' })
  @IsOptional() @IsBoolean() isSubAssembly?: boolean;
}

/** 创建 BOM DTO */
export class CreateBOMDto {
  @ApiProperty({ description: '成品物料 ID' })
  @IsString() @IsNotEmpty() productItemId: string;

  @ApiPropertyOptional({ description: '版本号', default: 'V1.0' })
  @IsOptional() @IsString() version?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional() @IsString() description?: string;

  @ApiProperty({ description: 'BOM 明细', type: [BOMItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BOMItemDto)
  items: BOMItemDto[];
}

/** 工单物料 DTO */
export class JobOrderMaterialDto {
  @ApiProperty({ description: '原材料物料 ID' })
  @IsString() @IsNotEmpty() materialItemId: string;

  @ApiProperty({ description: '需求数量' })
  @IsNumber() requiredQty: number;

  @ApiProperty({ description: '单位' })
  @IsString() @IsNotEmpty() uom: string;

  @ApiPropertyOptional({ description: '原材料批次 ID' })
  @IsOptional() @IsString() rawMaterialBatchId?: string;
}

/** 创建工单 DTO */
export class CreateJobOrderDto {
  @ApiProperty({ description: '成品物料 ID' })
  @IsString() @IsNotEmpty() productItemId: string;

  @ApiPropertyOptional({ description: 'BOM ID' })
  @IsOptional() @IsString() bomId?: string;

  @ApiProperty({ description: '计划数量' })
  @IsNumber() plannedQty: number;

  @ApiPropertyOptional({ description: '颜色' })
  @IsOptional() @IsString() color?: string;

  @ApiPropertyOptional({ description: '计划重量' })
  @IsOptional() @IsNumber() plannedWeight?: number;

  @ApiPropertyOptional({ description: '生产周期（天）' })
  @IsOptional() @IsNumber() productionCycle?: number;

  @ApiPropertyOptional({ description: '计划开始日期' })
  @IsOptional() @IsString() plannedStart?: string;

  @ApiPropertyOptional({ description: '计划结束日期' })
  @IsOptional() @IsString() plannedEnd?: string;

  @ApiPropertyOptional({ description: '工单物料', type: [JobOrderMaterialDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobOrderMaterialDto)
  materials?: JobOrderMaterialDto[];
}

/** 领料 DTO */
export class IssueMaterialDto {
  @ApiProperty({ description: '物料行 ID' })
  @IsString() @IsNotEmpty() materialId: string;

  @ApiProperty({ description: '领料数量' })
  @IsNumber() qty: number;

  @ApiPropertyOptional({ description: '原材料批次 ID' })
  @IsOptional() @IsString() rawMaterialBatchId?: string;
}

/** 产出登记 DTO */
export class OutputDto {
  @ApiProperty({ description: '产出数量' })
  @IsNumber() qty: number;

  @ApiPropertyOptional({ description: '实际重量' })
  @IsOptional() @IsNumber() actualWeight?: number;
}

/** 完工 DTO */
export class CompleteDto {
  @ApiProperty({ description: '重量' })
  @IsNumber() weight: number;

  @ApiPropertyOptional({ description: '重量单位', default: 'KG' })
  @IsOptional() @IsString() weightUnit?: string;

  @ApiPropertyOptional({ description: '仓位 ID' })
  @IsOptional() @IsString() warehouseLocationId?: string;

  @ApiPropertyOptional({ description: '使用的原材料批次', type: 'array' })
  @IsOptional()
  @IsArray()
  usedMaterials?: { rawMaterialBatchId: string; usedWeight: number }[];
}
