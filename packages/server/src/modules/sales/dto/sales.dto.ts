import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/** 销售单据明细行 DTO */
export class SalesDocumentItemDto {
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
}

/** 创建销售单据 DTO */
export class CreateSalesDocumentDto {
  @ApiProperty({ description: '单据类型', enum: ['QUOTATION', 'SALES_ORDER', 'DELIVERY_ORDER', 'INVOICE', 'CASH_SALE'] })
  @IsEnum(['QUOTATION', 'SALES_ORDER', 'DELIVERY_ORDER', 'INVOICE', 'CASH_SALE'])
  type: string;

  @ApiProperty({ description: '客户 ID' })
  @IsString() @IsNotEmpty() customerId: string;

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

  @ApiPropertyOptional({ description: '币种', enum: ['MYR', 'RMB', 'USD'] })
  @IsOptional() @IsEnum(['MYR', 'RMB', 'USD']) currency?: string;

  @ApiPropertyOptional({ description: '汇率' })
  @IsOptional() @IsNumber() exchangeRate?: number;

  @ApiPropertyOptional({ description: '来源单据 ID（转换时用）' })
  @IsOptional() @IsString() refDocId?: string;

  @ApiProperty({ description: '单据明细', type: [SalesDocumentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesDocumentItemDto)
  items: SalesDocumentItemDto[];
}

/** 创建客户收款 DTO */
export class CreateCustomerPaymentDto {
  @ApiProperty({ description: '客户 ID' })
  @IsString() @IsNotEmpty() customerId: string;

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
