import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/** 创建客户分支 DTO */
export class CreateCustomerBranchDto {
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
 * 创建客户 DTO
 */
export class CreateCustomerDto {
  @ApiProperty({ description: '公司名称' })
  @IsString()
  @IsNotEmpty({ message: '公司名称不能为空' })
  companyName: string;

  @ApiPropertyOptional({ description: '客户分类' })
  @IsOptional() @IsString() category?: string;

  @ApiPropertyOptional({ description: '国籍' })
  @IsOptional() @IsString() nationality?: string;

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

  @ApiPropertyOptional({ description: '分支列表', type: [CreateCustomerBranchDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerBranchDto)
  branches?: CreateCustomerBranchDto[];
}
