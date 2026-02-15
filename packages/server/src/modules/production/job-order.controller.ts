import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { JobOrderService } from './job-order.service.js';
import { CreateJobOrderDto, IssueMaterialDto, OutputDto, CompleteDto } from './dto/production.dto.js';

/**
 * 生产工单控制器
 */
@ApiTags('生产-工单')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('production/job-orders')
export class JobOrderController {
  constructor(private readonly jobOrderService: JobOrderService) {}

  /** 分页查询工单列表 */
  @Get()
  @ApiOperation({ summary: '查询工单列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ) {
    return this.jobOrderService.findAll({
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      status,
    });
  }

  /** 查询工单详情 */
  @Get(':id')
  @ApiOperation({ summary: '查询工单详情' })
  async findOne(@Param('id') id: string) {
    return this.jobOrderService.findOne(id);
  }

  /** 创建工单 */
  @Post()
  @ApiOperation({ summary: '创建生产工单' })
  async create(@Body() dto: CreateJobOrderDto, @Request() req: any) {
    return this.jobOrderService.create(dto, req.user?.id);
  }

  /** 更新工单 */
  @Put(':id')
  @ApiOperation({ summary: '更新工单' })
  async update(@Param('id') id: string, @Body() dto: CreateJobOrderDto) {
    return this.jobOrderService.update(id, dto);
  }

  /** 删除工单（仅 PLANNED 状态可删除） */
  @Delete(':id')
  @ApiOperation({ summary: '删除工单（仅 PLANNED 状态）' })
  async remove(@Param('id') id: string) {
    return this.jobOrderService.remove(id);
  }

  /** 领料 */
  @Post(':id/issue-material')
  @ApiOperation({ summary: '工单领料' })
  async issueMaterial(@Param('id') id: string, @Body() dto: IssueMaterialDto) {
    return this.jobOrderService.issueMaterial(id, dto);
  }

  /** 产出登记 */
  @Post(':id/output')
  @ApiOperation({ summary: '产出登记' })
  async output(@Param('id') id: string, @Body() dto: OutputDto) {
    return this.jobOrderService.output(id, dto);
  }

  /** 完工 */
  @Post(':id/complete')
  @ApiOperation({ summary: '完工（生成成品 + 溯源码）' })
  async complete(@Param('id') id: string, @Body() dto: CompleteDto) {
    return this.jobOrderService.complete(id, dto);
  }
}
