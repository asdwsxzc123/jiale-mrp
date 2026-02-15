import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { StockItemService } from './stock-item.service.js';
import { CreateStockItemDto } from './dto/stock.dto.js';

/**
 * 库存物料控制器
 */
@ApiTags('库存-物料')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock/items')
export class StockItemController {
  constructor(private readonly stockItemService: StockItemService) {}

  /** 分页查询物料列表 */
  @Get()
  @ApiOperation({ summary: '查询物料列表（分页+搜索）' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'groupId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('groupId') groupId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.stockItemService.findAll({
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      search, groupId, categoryId,
    });
  }

  /** 查询物料详情 */
  @Get(':id')
  @ApiOperation({ summary: '查询物料详情' })
  async findOne(@Param('id') id: string) {
    return this.stockItemService.findOne(id);
  }

  /** 创建物料 */
  @Post()
  @ApiOperation({ summary: '创建物料' })
  async create(@Body() dto: CreateStockItemDto) {
    return this.stockItemService.create(dto);
  }

  /** 更新物料 */
  @Put(':id')
  @ApiOperation({ summary: '更新物料' })
  async update(@Param('id') id: string, @Body() dto: CreateStockItemDto) {
    return this.stockItemService.update(id, dto);
  }

  /** 删除物料 */
  @Delete(':id')
  @ApiOperation({ summary: '删除物料（软删除）' })
  async remove(@Param('id') id: string) {
    return this.stockItemService.remove(id);
  }
}
