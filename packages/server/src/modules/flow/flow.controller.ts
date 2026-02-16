import {
  Controller, Get, Post, Delete,
  Body, Param, Query, Res, UseGuards, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { FlowService } from './flow.service.js';
import { FlowExportService } from './flow-export.service.js';
import { CreateInboundDto } from './dto/create-inbound.dto.js';
import { CreateOutboundDto } from './dto/create-outbound.dto.js';
import { CreateYieldRateDto } from './dto/create-yield-rate.dto.js';
import { QueryFlowDto } from './dto/query-flow.dto.js';
import { existsSync } from 'fs';

/**
 * 流水控制器 - 入库流水/出库流水/出成率的接口
 */
@ApiTags('流水管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('flow')
export class FlowController {
  constructor(
    private readonly flowService: FlowService,
    private readonly flowExportService: FlowExportService,
  ) {}

  // ==================== 入库流水 ====================

  @Get('inbound')
  @ApiOperation({ summary: '查询入库流水列表（分页+筛选）' })
  async findAllInbound(@Query() query: QueryFlowDto) {
    return this.flowService.findAllInbound({
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      startDate: query.startDate,
      endDate: query.endDate,
      customerId: query.customerId,
      stockItemId: query.stockItemId,
    });
  }

  @Post('inbound')
  @ApiOperation({ summary: '新增入库流水' })
  async createInbound(@Body() dto: CreateInboundDto) {
    return this.flowService.createInbound(dto);
  }

  @Delete('inbound/:id')
  @ApiOperation({ summary: '删除入库流水' })
  async removeInbound(@Param('id') id: string) {
    return this.flowService.removeInbound(id);
  }

  @Post('inbound/export')
  @ApiOperation({ summary: '导出入库流水为 Excel' })
  async exportInbound(@Body() query: QueryFlowDto) {
    const data = await this.flowService.findAllInboundForExport({
      startDate: query.startDate, endDate: query.endDate,
      customerId: query.customerId, stockItemId: query.stockItemId,
    });
    const filename = await this.flowExportService.exportInbound(data);
    return { filename };
  }

  // ==================== 出库流水 ====================

  @Get('outbound')
  @ApiOperation({ summary: '查询出库流水列表（分页+筛选）' })
  async findAllOutbound(@Query() query: QueryFlowDto) {
    return this.flowService.findAllOutbound({
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      startDate: query.startDate, endDate: query.endDate,
      customerId: query.customerId, stockItemId: query.stockItemId,
    });
  }

  @Post('outbound')
  @ApiOperation({ summary: '新增出库流水' })
  async createOutbound(@Body() dto: CreateOutboundDto) {
    return this.flowService.createOutbound(dto);
  }

  @Delete('outbound/:id')
  @ApiOperation({ summary: '删除出库流水' })
  async removeOutbound(@Param('id') id: string) {
    return this.flowService.removeOutbound(id);
  }

  @Post('outbound/export')
  @ApiOperation({ summary: '导出出库流水为 Excel' })
  async exportOutbound(@Body() query: QueryFlowDto) {
    const data = await this.flowService.findAllOutboundForExport({
      startDate: query.startDate, endDate: query.endDate,
      customerId: query.customerId, stockItemId: query.stockItemId,
    });
    const filename = await this.flowExportService.exportOutbound(data);
    return { filename };
  }

  // ==================== 出成率 ====================

  @Get('yield-rate')
  @ApiOperation({ summary: '查询出成率列表（分页+筛选）' })
  async findAllYieldRate(@Query() query: QueryFlowDto) {
    return this.flowService.findAllYieldRate({
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      startDate: query.startDate, endDate: query.endDate,
      customerId: query.customerId, stockItemId: query.stockItemId,
    });
  }

  @Post('yield-rate')
  @ApiOperation({ summary: '新增出成率记录' })
  async createYieldRate(@Body() dto: CreateYieldRateDto) {
    return this.flowService.createYieldRate(dto);
  }

  @Delete('yield-rate/:id')
  @ApiOperation({ summary: '删除出成率记录' })
  async removeYieldRate(@Param('id') id: string) {
    return this.flowService.removeYieldRate(id);
  }

  @Post('yield-rate/export')
  @ApiOperation({ summary: '导出出成率为 Excel' })
  async exportYieldRate(@Body() query: QueryFlowDto) {
    const data = await this.flowService.findAllYieldRateForExport({
      startDate: query.startDate, endDate: query.endDate,
      customerId: query.customerId, stockItemId: query.stockItemId,
    });
    const filename = await this.flowExportService.exportYieldRate(data);
    return { filename };
  }

  // ==================== 文件下载 ====================

  @Get('download/:filename')
  @ApiOperation({ summary: '下载导出的 Excel 文件' })
  async download(@Param('filename') filename: string, @Res() res: Response) {
    // 安全校验：只允许 .xlsx 文件名，防止路径穿越
    if (!/^[\w\-]+\.xlsx$/.test(filename)) {
      throw new NotFoundException('文件不存在');
    }
    const filePath = this.flowExportService.getFilePath(filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('文件不存在或已过期');
    }
    res.download(filePath, filename);
  }
}
