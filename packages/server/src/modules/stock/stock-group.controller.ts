import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStockGroupDto } from './dto/stock.dto.js';

/**
 * 库存分组控制器 - 物料分组的 CRUD
 */
@ApiTags('库存-分组')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock/groups')
export class StockGroupController {
  constructor(private prisma: PrismaService) {}

  /** 查询分组列表（分页） */
  @Get()
  @ApiOperation({ summary: '查询库存分组列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const p = page ? parseInt(page) : 1;
    const ps = pageSize ? parseInt(pageSize) : 50;
    const [data, total] = await Promise.all([
      this.prisma.stockGroup.findMany({ skip: (p - 1) * ps, take: ps, orderBy: { name: 'asc' } }),
      this.prisma.stockGroup.count(),
    ]);
    return { data, total, page: p, pageSize: ps };
  }

  /** 查询单个分组 */
  @Get(':id')
  @ApiOperation({ summary: '查询分组详情' })
  async findOne(@Param('id') id: string) {
    return this.prisma.stockGroup.findUnique({ where: { id } });
  }

  /** 创建分组 */
  @Post()
  @ApiOperation({ summary: '创建库存分组' })
  async create(@Body() dto: CreateStockGroupDto) {
    return this.prisma.stockGroup.create({ data: dto });
  }

  /** 更新分组 */
  @Put(':id')
  @ApiOperation({ summary: '更新库存分组' })
  async update(@Param('id') id: string, @Body() dto: CreateStockGroupDto) {
    return this.prisma.stockGroup.update({ where: { id }, data: dto });
  }

  /** 删除分组 */
  @Delete(':id')
  @ApiOperation({ summary: '删除库存分组' })
  async remove(@Param('id') id: string) {
    return this.prisma.stockGroup.delete({ where: { id } });
  }
}
