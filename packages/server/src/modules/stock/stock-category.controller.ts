import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStockCategoryDto } from './dto/stock.dto.js';

/**
 * 库存分类控制器 - 物料分类的 CRUD
 */
@ApiTags('库存-分类')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock/categories')
export class StockCategoryController {
  constructor(private prisma: PrismaService) {}

  /** 查询分类列表 */
  @Get()
  @ApiOperation({ summary: '查询库存分类列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const p = page ? parseInt(page) : 1;
    const ps = pageSize ? parseInt(pageSize) : 50;
    const [data, total] = await Promise.all([
      this.prisma.stockCategory.findMany({ skip: (p - 1) * ps, take: ps, orderBy: { name: 'asc' } }),
      this.prisma.stockCategory.count(),
    ]);
    return { data, total, page: p, pageSize: ps };
  }

  /** 查询分类详情 */
  @Get(':id')
  @ApiOperation({ summary: '查询分类详情' })
  async findOne(@Param('id') id: string) {
    return this.prisma.stockCategory.findUnique({ where: { id } });
  }

  /** 创建分类 */
  @Post()
  @ApiOperation({ summary: '创建库存分类' })
  async create(@Body() dto: CreateStockCategoryDto) {
    return this.prisma.stockCategory.create({ data: dto });
  }

  /** 更新分类 */
  @Put(':id')
  @ApiOperation({ summary: '更新库存分类' })
  async update(@Param('id') id: string, @Body() dto: CreateStockCategoryDto) {
    return this.prisma.stockCategory.update({ where: { id }, data: dto });
  }

  /** 删除分类 */
  @Delete(':id')
  @ApiOperation({ summary: '删除库存分类' })
  async remove(@Param('id') id: string) {
    return this.prisma.stockCategory.delete({ where: { id } });
  }
}
