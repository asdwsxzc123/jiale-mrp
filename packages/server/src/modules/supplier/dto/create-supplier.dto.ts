import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/** 创建供应商分支 DTO */
export class CreateSupplierBranchDto {
  @ApiProperty({ description: '分支名称' })
  @IsString()
  @IsNotEmpty()
  branchName: string;

  @ApiPropertyOptional() @IsOptional() @IsString() address1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address2?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address3?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address4?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postcode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mobile?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fax?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
}

/**
 * 创建供应商 DTO
 */
export class CreateSupplierDto {
  @ApiProperty({ description: '公司名称' })
  @IsString()
  @IsNotEmpty({ message: '公司名称不能为空' })
  companyName: string;

  @ApiPropertyOptional({ description: '供应商分类' })
  @IsOptional() @IsString() category?: string;

  @ApiPropertyOptional({ description: '国籍' })
  @IsOptional() @IsString() nationality?: string;

  @ApiPropertyOptional({ description: '行业代码' })
  @IsOptional() @IsString() industriesCode?: string;

  @ApiPropertyOptional({ description: '注册号' })
  @IsOptional() @IsString() regNo?: string;

  @ApiPropertyOptional({ description: '联系人' })
  @IsOptional() @IsString() attention?: string;

  @ApiPropertyOptional({ description: '电话' })
  @IsOptional() @IsString() phone?: string;

  @ApiPropertyOptional({ description: '手机' })
  @IsOptional() @IsString() mobile?: string;

  @ApiPropertyOptional({ description: '传真' })
  @IsOptional() @IsString() fax?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional() @IsString() email?: string;

  @ApiPropertyOptional({ description: '币种', enum: ['MYR', 'RMB', 'USD'] })
  @IsOptional() @IsEnum(['MYR', 'RMB', 'USD']) currency?: string;

  @ApiPropertyOptional({ description: '分支列表', type: [CreateSupplierBranchDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierBranchDto)
  branches?: CreateSupplierBranchDto[];
}
