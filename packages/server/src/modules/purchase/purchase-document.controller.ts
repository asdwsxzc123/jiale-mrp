import {
  Controller, Get, Post, Put,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { PurchaseDocumentService } from './purchase-document.service.js';
import { CreatePurchaseDocumentDto } from './dto/purchase.dto.js';

/**
 * 采购单据控制器
 */
@ApiTags('采购-单据')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchase/documents')
export class PurchaseDocumentController {
  constructor(private readonly purchaseDocumentService: PurchaseDocumentService) {}

  /** 分页查询采购单据 */
  @Get()
  @ApiOperation({ summary: '查询采购单据列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.purchaseDocumentService.findAll({
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      type, status, supplierId,
    });
  }

  /** 查询单据详情 */
  @Get(':id')
  @ApiOperation({ summary: '查询采购单据详情' })
  async findOne(@Param('id') id: string) {
    return this.purchaseDocumentService.findOne(id);
  }

  /** 创建采购单据 */
  @Post()
  @ApiOperation({ summary: '创建采购单据' })
  async create(@Body() dto: CreatePurchaseDocumentDto, @Request() req: any) {
    return this.purchaseDocumentService.create(dto, req.user?.id);
  }

  /** 更新采购单据 */
  @Put(':id')
  @ApiOperation({ summary: '更新采购单据（仅 DRAFT 状态）' })
  async update(@Param('id') id: string, @Body() dto: CreatePurchaseDocumentDto) {
    return this.purchaseDocumentService.update(id, dto);
  }

  /** 单据转换 */
  @Post(':id/transfer')
  @ApiOperation({ summary: '采购单据转换' })
  async transfer(
    @Param('id') id: string,
    @Body('targetType') targetType: string,
    @Request() req: any,
  ) {
    return this.purchaseDocumentService.transfer(id, targetType, req.user?.id);
  }

  /** 审批单据 */
  @Post(':id/approve')
  @ApiOperation({ summary: '审批采购单据' })
  async approve(@Param('id') id: string) {
    return this.purchaseDocumentService.approve(id);
  }

  /** 取消单据 */
  @Post(':id/cancel')
  @ApiOperation({ summary: '取消采购单据' })
  async cancel(@Param('id') id: string) {
    return this.purchaseDocumentService.cancel(id);
  }
}
