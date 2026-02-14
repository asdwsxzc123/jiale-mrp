import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/** 创建库存分组 DTO */
export class CreateStockGroupDto {
  @ApiProperty({ description: '分组名称' })
  @IsString() @IsNotEmpty() name: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional() @IsString() description?: string;
}

/** 创建库存分类 DTO */
export class CreateStockCategoryDto {
  @ApiProperty({ description: '分类名称' })
  @IsString() @IsNotEmpty() name: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional() @IsString() description?: string;
}

/** 创建库存仓位 DTO */
export class CreateStockLocationDto {
  @ApiProperty({ description: '仓位名称' })
  @IsString() @IsNotEmpty() name: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional() @IsString() description?: string;
}

/** 创建库存物料 DTO */
export class CreateStockItemDto {
  @ApiProperty({ description: '物料编码' })
  @IsString() @IsNotEmpty() code: string;

  @ApiProperty({ description: '物料描述' })
  @IsString() @IsNotEmpty() description: string;

  @ApiPropertyOptional() @IsOptional() @IsString() groupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() baseUom?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() reorderLevel?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() reorderQty?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() leadTime?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() refCost?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() refPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() barcode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shelf?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() outputTaxRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() inputTaxRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() stockControl?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() serialNoTracking?: boolean;
}

/** 库存事务明细行 DTO */
export class StockTransactionItemDto {
  @ApiProperty({ description: '物料 ID' })
  @IsString() @IsNotEmpty() itemId: string;

  @ApiProperty({ description: '数量' })
  @IsNumber() qty: number;

  @ApiProperty({ description: '单位' })
  @IsString() @IsNotEmpty() uom: string;

  @ApiPropertyOptional({ description: '单位成本' })
  @IsOptional() @IsNumber() unitCost?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional() @IsString() notes?: string;
}

/** 创建库存事务 DTO */
export class CreateStockTransactionDto {
  @ApiProperty({ description: '事务类型', enum: ['RECEIVED', 'ISSUE', 'ADJUSTMENT', 'TRANSFER', 'ASSEMBLY', 'DISASSEMBLY'] })
  @IsEnum(['RECEIVED', 'ISSUE', 'ADJUSTMENT', 'TRANSFER', 'ASSEMBLY', 'DISASSEMBLY'])
  type: string;

  @ApiProperty({ description: '日期' })
  @IsString() @IsNotEmpty() date: string;

  @ApiPropertyOptional({ description: '来源仓位 ID' })
  @IsOptional() @IsString() locationFromId?: string;

  @ApiPropertyOptional({ description: '目标仓位 ID' })
  @IsOptional() @IsString() locationToId?: string;

  @ApiPropertyOptional({ description: '关联单据类型' })
  @IsOptional() @IsString() refDocumentType?: string;

  @ApiPropertyOptional({ description: '关联单据 ID' })
  @IsOptional() @IsString() refDocumentId?: string;

  @ApiProperty({ description: '事务明细行', type: [StockTransactionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockTransactionItemDto)
  items: StockTransactionItemDto[];
}
