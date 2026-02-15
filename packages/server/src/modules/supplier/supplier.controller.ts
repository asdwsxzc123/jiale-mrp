import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { SupplierService } from './supplier.service.js';
import { CreateSupplierDto, CreateSupplierBranchDto } from './dto/create-supplier.dto.js';
import { UpdateSupplierDto } from './dto/update-supplier.dto.js';

/**
 * 供应商控制器 - 供应商及分支的增删改查
 */
@ApiTags('供应商管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  /** 分页查询供应商列表 */
  @Get()
  @ApiOperation({ summary: '查询供应商列表（分页+搜索+筛选）' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.supplierService.findAll({
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      search,
      category,
    });
  }

  /** 查询供应商详情 */
  @Get(':id')
  @ApiOperation({ summary: '查询供应商详情（含分支）' })
  async findOne(@Param('id') id: string) {
    return this.supplierService.findOne(id);
  }

  /** 创建供应商 */
  @Post()
  @ApiOperation({ summary: '创建供应商（自动生成编码 400-XXXX）' })
  async create(@Body() dto: CreateSupplierDto) {
    return this.supplierService.create(dto);
  }

  /** 更新供应商 */
  @Put(':id')
  @ApiOperation({ summary: '更新供应商信息' })
  async update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.supplierService.update(id, dto);
  }

  /** 软删除供应商 */
  @Delete(':id')
  @ApiOperation({ summary: '删除供应商（软删除）' })
  async remove(@Param('id') id: string) {
    return this.supplierService.remove(id);
  }

  /** 创建供应商分支 */
  @Post(':id/branches')
  @ApiOperation({ summary: '创建供应商分支' })
  async createBranch(@Param('id') id: string, @Body() dto: CreateSupplierBranchDto) {
    return this.supplierService.createBranch(id, dto);
  }

  /** 更新供应商分支 */
  @Put(':id/branches/:branchId')
  @ApiOperation({ summary: '更新供应商分支' })
  async updateBranch(
    @Param('id') id: string,
    @Param('branchId') branchId: string,
    @Body() dto: CreateSupplierBranchDto,
  ) {
    return this.supplierService.updateBranch(id, branchId, dto);
  }

  /** 删除供应商分支 */
  @Delete(':id/branches/:branchId')
  @ApiOperation({ summary: '删除供应商分支' })
  async removeBranch(@Param('id') id: string, @Param('branchId') branchId: string) {
    return this.supplierService.removeBranch(id, branchId);
  }
}
