import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStockLocationDto } from './dto/stock.dto.js';

/**
 * 库存仓位控制器 - 仓储位置的 CRUD
 */
@ApiTags('库存-仓位')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock/locations')
export class StockLocationController {
  constructor(private prisma: PrismaService) {}

  /** 查询仓位列表 */
  @Get()
  @ApiOperation({ summary: '查询仓位列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const p = page ? parseInt(page) : 1;
    const ps = pageSize ? parseInt(pageSize) : 50;
    const [data, total] = await Promise.all([
      this.prisma.stockLocation.findMany({ skip: (p - 1) * ps, take: ps, orderBy: { name: 'asc' } }),
      this.prisma.stockLocation.count(),
    ]);
    return { data, total, page: p, pageSize: ps };
  }

  /** 查询仓位详情 */
  @Get(':id')
  @ApiOperation({ summary: '查询仓位详情' })
  async findOne(@Param('id') id: string) {
    return this.prisma.stockLocation.findUnique({ where: { id } });
  }

  /** 创建仓位 */
  @Post()
  @ApiOperation({ summary: '创建仓位' })
  async create(@Body() dto: CreateStockLocationDto) {
    return this.prisma.stockLocation.create({ data: dto });
  }

  /** 更新仓位 */
  @Put(':id')
  @ApiOperation({ summary: '更新仓位' })
  async update(@Param('id') id: string, @Body() dto: CreateStockLocationDto) {
    return this.prisma.stockLocation.update({ where: { id }, data: dto });
  }

  /** 删除仓位 */
  @Delete(':id')
  @ApiOperation({ summary: '删除仓位' })
  async remove(@Param('id') id: string) {
    return this.prisma.stockLocation.delete({ where: { id } });
  }
}
