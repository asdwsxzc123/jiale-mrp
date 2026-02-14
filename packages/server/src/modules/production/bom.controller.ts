import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { BOMService } from './bom.service.js';
import { CreateBOMDto } from './dto/production.dto.js';

/**
 * BOM 物料清单控制器
 */
@ApiTags('生产-BOM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('production/boms')
export class BOMController {
  constructor(private readonly bomService: BOMService) {}

  /** 分页查询 BOM 列表 */
  @Get()
  @ApiOperation({ summary: '查询 BOM 列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'productItemId', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('productItemId') productItemId?: string,
  ) {
    return this.bomService.findAll({
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      productItemId,
    });
  }

  /** 查询 BOM 详情 */
  @Get(':id')
  @ApiOperation({ summary: '查询 BOM 详情' })
  async findOne(@Param('id') id: string) {
    return this.bomService.findOne(id);
  }

  /** 递归展开 BOM */
  @Get(':id/expand')
  @ApiOperation({ summary: '递归展开 BOM（包含子装配件）' })
  async expand(@Param('id') id: string) {
    return this.bomService.expand(id);
  }

  /** 创建 BOM */
  @Post()
  @ApiOperation({ summary: '创建 BOM' })
  async create(@Body() dto: CreateBOMDto) {
    return this.bomService.create(dto);
  }

  /** 更新 BOM */
  @Put(':id')
  @ApiOperation({ summary: '更新 BOM' })
  async update(@Param('id') id: string, @Body() dto: CreateBOMDto) {
    return this.bomService.update(id, dto);
  }

  /** 删除 BOM */
  @Delete(':id')
  @ApiOperation({ summary: '删除 BOM（软删除）' })
  async remove(@Param('id') id: string) {
    return this.bomService.remove(id);
  }
}
