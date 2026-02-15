import {
  Controller, Get, Post, Put,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { SalesDocumentService } from './sales-document.service.js';
import { CreateSalesDocumentDto } from './dto/sales.dto.js';

/**
 * 销售单据控制器
 */
@ApiTags('销售-单据')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales/documents')
export class SalesDocumentController {
  constructor(private readonly salesDocumentService: SalesDocumentService) {}

  /** 分页查询销售单据 */
  @Get()
  @ApiOperation({ summary: '查询销售单据列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.salesDocumentService.findAll({
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      type, status, customerId,
    });
  }

  /** 查询单据详情 */
  @Get(':id')
  @ApiOperation({ summary: '查询销售单据详情' })
  async findOne(@Param('id') id: string) {
    return this.salesDocumentService.findOne(id);
  }

  /** 创建销售单据 */
  @Post()
  @ApiOperation({ summary: '创建销售单据' })
  async create(@Body() dto: CreateSalesDocumentDto, @Request() req: any) {
    return this.salesDocumentService.create(dto, req.user?.id);
  }

  /** 更新销售单据 */
  @Put(':id')
  @ApiOperation({ summary: '更新销售单据（仅 DRAFT 状态）' })
  async update(@Param('id') id: string, @Body() dto: CreateSalesDocumentDto) {
    return this.salesDocumentService.update(id, dto);
  }

  /** 单据转换 */
  @Post(':id/transfer')
  @ApiOperation({ summary: '单据转换（如报价 -> 订单 -> 出货 -> 发票）' })
  async transfer(
    @Param('id') id: string,
    @Body('targetType') targetType: string,
    @Request() req: any,
  ) {
    return this.salesDocumentService.transfer(id, targetType, req.user?.id);
  }

  /** 审批单据 */
  @Post(':id/approve')
  @ApiOperation({ summary: '审批销售单据' })
  async approve(@Param('id') id: string) {
    return this.salesDocumentService.approve(id);
  }

  /** 取消单据 */
  @Post(':id/cancel')
  @ApiOperation({ summary: '取消销售单据' })
  async cancel(@Param('id') id: string) {
    return this.salesDocumentService.cancel(id);
  }
}
