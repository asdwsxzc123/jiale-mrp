import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** 创建/更新货币 DTO */
export class CreateCurrencyDto {
  @ApiProperty({ description: '货币代码', enum: ['MYR', 'RMB', 'USD'] })
  @IsEnum(['MYR', 'RMB', 'USD'])
  code: string;

  @ApiProperty({ description: '名称' })
  @IsString() @IsNotEmpty() name: string;

  @ApiProperty({ description: '符号' })
  @IsString() @IsNotEmpty() symbol: string;

  @ApiPropertyOptional({ description: '汇率' })
  @IsOptional() @IsNumber() exchangeRate?: number;

  @ApiPropertyOptional({ description: '是否基础货币' })
  @IsOptional() @IsBoolean() isBase?: boolean;
}

/** 创建/更新税码 DTO */
export class CreateTaxCodeDto {
  @ApiProperty({ description: '税码' })
  @IsString() @IsNotEmpty() code: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional() @IsString() description?: string;

  @ApiProperty({ description: '税率' })
  @IsNumber() rate: number;
}

/** 创建用户 DTO */
export class CreateUserDto {
  @ApiProperty({ description: '用户名' })
  @IsString() @IsNotEmpty() username: string;

  @ApiProperty({ description: '密码' })
  @IsString() @IsNotEmpty() password: string;

  @ApiProperty({ description: '姓名' })
  @IsString() @IsNotEmpty() name: string;

  @ApiPropertyOptional({ description: '角色', enum: ['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER'] })
  @IsOptional() @IsEnum(['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']) role?: string;
}

/** 更新用户 DTO */
export class UpdateUserDto {
  @ApiPropertyOptional({ description: '密码' })
  @IsOptional() @IsString() password?: string;

  @ApiPropertyOptional({ description: '姓名' })
  @IsOptional() @IsString() name?: string;

  @ApiPropertyOptional({ description: '角色' })
  @IsOptional() @IsEnum(['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']) role?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional() @IsBoolean() isActive?: boolean;
}
