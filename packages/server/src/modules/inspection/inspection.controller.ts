import {
  Controller, Get, Post, Put,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { InspectionService } from './inspection.service.js';
import { CreateInspectionDto, PassInspectionDto } from './dto/inspection.dto.js';

/**
 * 来料检验控制器
 */
@ApiTags('来料检验')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inspections')
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  /** 分页查询检验记录 */
  @Get()
  @ApiOperation({ summary: '查询来料检验列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.inspectionService.findAll({
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      status, supplierId,
    });
  }

  /** 查询检验详情 */
  @Get(':id')
  @ApiOperation({ summary: '查询检验详情' })
  async findOne(@Param('id') id: string) {
    return this.inspectionService.findOne(id);
  }

  /** 创建检验记录 */
  @Post()
  @ApiOperation({ summary: '创建来料检验记录' })
  async create(@Body() dto: CreateInspectionDto) {
    return this.inspectionService.create(dto);
  }

  /** 更新检验记录（仅 PENDING 状态可编辑） */
  @Put(':id')
  @ApiOperation({ summary: '更新检验记录' })
  async update(@Param('id') id: string, @Body() dto: CreateInspectionDto) {
    return this.inspectionService.update(id, dto);
  }

  /** 检验合格 -> 生成原材料批次 + 溯源码 */
  @Post(':id/pass')
  @ApiOperation({ summary: '检验合格（生成原材料批次 + 溯源码）' })
  async pass(@Param('id') id: string, @Body() dto: PassInspectionDto) {
    return this.inspectionService.pass(id, dto);
  }

  /** 检验不合格 */
  @Post(':id/reject')
  @ApiOperation({ summary: '检验不合格' })
  async reject(@Param('id') id: string) {
    return this.inspectionService.reject(id);
  }
}
