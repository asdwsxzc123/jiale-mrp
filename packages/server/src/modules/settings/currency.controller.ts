import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCurrencyDto } from './dto/settings.dto.js';

/**
 * 货币设置控制器
 */
@ApiTags('设置-货币')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings/currencies')
export class CurrencyController {
  constructor(private prisma: PrismaService) {}

  /** 查询货币列表 */
  @Get()
  @ApiOperation({ summary: '查询货币列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const p = page ? parseInt(page) : 1;
    const ps = pageSize ? parseInt(pageSize) : 50;
    const [data, total] = await Promise.all([
      this.prisma.currency.findMany({ skip: (p - 1) * ps, take: ps }),
      this.prisma.currency.count(),
    ]);
    return { data, total, page: p, pageSize: ps };
  }

  /** 查询单个货币 */
  @Get(':id')
  @ApiOperation({ summary: '查询货币详情' })
  async findOne(@Param('id') id: string) {
    return this.prisma.currency.findUnique({ where: { id } });
  }

  /** 创建货币 */
  @Post()
  @ApiOperation({ summary: '创建货币' })
  async create(@Body() dto: CreateCurrencyDto) {
    return this.prisma.currency.create({
      data: { ...dto, code: dto.code as any },
    });
  }

  /** 更新货币 */
  @Put(':id')
  @ApiOperation({ summary: '更新货币' })
  async update(@Param('id') id: string, @Body() dto: CreateCurrencyDto) {
    return this.prisma.currency.update({
      where: { id },
      data: { ...dto, code: dto.code as any },
    });
  }

  /** 删除货币 */
  @Delete(':id')
  @ApiOperation({ summary: '删除货币' })
  async remove(@Param('id') id: string) {
    return this.prisma.currency.delete({ where: { id } });
  }
}
