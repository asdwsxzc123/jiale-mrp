import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { CustomerService } from './customer.service.js';
import { CreateCustomerDto, CreateCustomerBranchDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

/**
 * 客户控制器 - 客户及分支的增删改查
 */
@ApiTags('客户管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  /** 分页查询客户列表 */
  @Get()
  @ApiOperation({ summary: '查询客户列表（分页+搜索+筛选）' })
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
    return this.customerService.findAll({
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      search,
      category,
    });
  }

  /** 查询单个客户详情 */
  @Get(':id')
  @ApiOperation({ summary: '查询客户详情（含分支）' })
  async findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  /** 创建客户 */
  @Post()
  @ApiOperation({ summary: '创建客户（自动生成编码 300-XXXX）' })
  async create(@Body() dto: CreateCustomerDto) {
    return this.customerService.create(dto);
  }

  /** 更新客户 */
  @Put(':id')
  @ApiOperation({ summary: '更新客户信息' })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(id, dto);
  }

  /** 软删除客户 */
  @Delete(':id')
  @ApiOperation({ summary: '删除客户（软删除）' })
  async remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }

  /** 创建客户分支 */
  @Post(':id/branches')
  @ApiOperation({ summary: '创建客户分支' })
  async createBranch(@Param('id') id: string, @Body() dto: CreateCustomerBranchDto) {
    return this.customerService.createBranch(id, dto);
  }

  /** 更新客户分支 */
  @Put(':id/branches/:branchId')
  @ApiOperation({ summary: '更新客户分支' })
  async updateBranch(
    @Param('id') id: string,
    @Param('branchId') branchId: string,
    @Body() dto: CreateCustomerBranchDto,
  ) {
    return this.customerService.updateBranch(id, branchId, dto);
  }

  /** 删除客户分支 */
  @Delete(':id/branches/:branchId')
  @ApiOperation({ summary: '删除客户分支' })
  async removeBranch(@Param('id') id: string, @Param('branchId') branchId: string) {
    return this.customerService.removeBranch(id, branchId);
  }
}
