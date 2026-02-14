import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/** 采购单据明细行 DTO */
export class PurchaseDocumentItemDto {
  @ApiPropertyOptional({ description: '物料 ID' })
  @IsOptional() @IsString() itemId?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional() @IsString() description?: string;

  @ApiProperty({ description: '数量' })
  @IsNumber() qty: number;

  @ApiPropertyOptional({ description: '单位' })
  @IsOptional() @IsString() uom?: string;

  @ApiProperty({ description: '单价' })
  @IsNumber() unitPrice: number;

  @ApiPropertyOptional({ description: '折扣' })
  @IsOptional() @IsNumber() discount?: number;

  @ApiPropertyOptional({ description: '税码' })
  @IsOptional() @IsString() taxCode?: string;

  @ApiPropertyOptional({ description: '税率' })
  @IsOptional() @IsNumber() taxRate?: number;

  @ApiPropertyOptional({ description: '含税' })
  @IsOptional() @IsBoolean() taxInclusive?: boolean;

  @ApiPropertyOptional({ description: '计划重量' })
  @IsOptional() @IsNumber() plannedWeight?: number;

  @ApiPropertyOptional({ description: '实际重量' })
  @IsOptional() @IsNumber() actualWeight?: number;

  @ApiPropertyOptional({ description: '计划到货日' })
  @IsOptional() @IsString() plannedArrivalDate?: string;

  @ApiPropertyOptional({ description: '实际到货日' })
  @IsOptional() @IsString() actualArrivalDate?: string;

  @ApiPropertyOptional({ description: '支付方式' })
  @IsOptional() @IsString() paymentMethod?: string;

  @ApiPropertyOptional({ description: '重量单位' })
  @IsOptional() @IsString() weightUnit?: string;
}

/** 创建采购单据 DTO */
export class CreatePurchaseDocumentDto {
  @ApiProperty({ description: '单据类型', enum: ['REQUEST', 'ORDER', 'GOODS_RECEIVED', 'INVOICE', 'CASH_PURCHASE', 'RETURNED'] })
  @IsEnum(['REQUEST', 'ORDER', 'GOODS_RECEIVED', 'INVOICE', 'CASH_PURCHASE', 'RETURNED'])
  type: string;

  @ApiProperty({ description: '供应商 ID' })
  @IsString() @IsNotEmpty() supplierId: string;

  @ApiPropertyOptional({ description: '分支 ID' })
  @IsOptional() @IsString() branchId?: string;

  @ApiProperty({ description: '日期' })
  @IsString() @IsNotEmpty() date: string;

  @ApiPropertyOptional() @IsOptional() @IsString() agent?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() terms?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() project?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() refNo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() extNo?: string;

  @ApiPropertyOptional({ description: '币种' })
  @IsOptional() @IsEnum(['MYR', 'RMB', 'USD']) currency?: string;

  @ApiPropertyOptional({ description: '汇率' })
  @IsOptional() @IsNumber() exchangeRate?: number;

  @ApiPropertyOptional({ description: '来源单据 ID' })
  @IsOptional() @IsString() refDocId?: string;

  @ApiProperty({ description: '单据明细', type: [PurchaseDocumentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseDocumentItemDto)
  items: PurchaseDocumentItemDto[];
}

/** 创建供应商付款 DTO */
export class CreateSupplierPaymentDto {
  @ApiProperty({ description: '供应商 ID' })
  @IsString() @IsNotEmpty() supplierId: string;

  @ApiProperty({ description: '日期' })
  @IsString() @IsNotEmpty() date: string;

  @ApiProperty({ description: '金额' })
  @IsNumber() amount: number;

  @ApiPropertyOptional({ description: '币种' })
  @IsOptional() @IsEnum(['MYR', 'RMB', 'USD']) currency?: string;

  @ApiPropertyOptional({ description: '支付方式' })
  @IsOptional() @IsString() method?: string;

  @ApiPropertyOptional({ description: '参考号' })
  @IsOptional() @IsString() refNo?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional() @IsString() notes?: string;
}
