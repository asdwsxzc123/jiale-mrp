import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaxCodeDto } from './dto/settings.dto.js';

/**
 * 税码设置控制器
 */
@ApiTags('设置-税码')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings/tax-codes')
export class TaxCodeController {
  constructor(private prisma: PrismaService) {}

  /** 查询税码列表 */
  @Get()
  @ApiOperation({ summary: '查询税码列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const p = page ? parseInt(page) : 1;
    const ps = pageSize ? parseInt(pageSize) : 50;
    const [data, total] = await Promise.all([
      this.prisma.taxCode.findMany({ skip: (p - 1) * ps, take: ps }),
      this.prisma.taxCode.count(),
    ]);
    return { data, total, page: p, pageSize: ps };
  }

  /** 查询税码详情 */
  @Get(':id')
  @ApiOperation({ summary: '查询税码详情' })
  async findOne(@Param('id') id: string) {
    return this.prisma.taxCode.findUnique({ where: { id } });
  }

  /** 创建税码 */
  @Post()
  @ApiOperation({ summary: '创建税码' })
  async create(@Body() dto: CreateTaxCodeDto) {
    return this.prisma.taxCode.create({ data: dto });
  }

  /** 更新税码 */
  @Put(':id')
  @ApiOperation({ summary: '更新税码' })
  async update(@Param('id') id: string, @Body() dto: CreateTaxCodeDto) {
    return this.prisma.taxCode.update({ where: { id }, data: dto });
  }

  /** 删除税码 */
  @Delete(':id')
  @ApiOperation({ summary: '删除税码' })
  async remove(@Param('id') id: string) {
    return this.prisma.taxCode.delete({ where: { id } });
  }
}
