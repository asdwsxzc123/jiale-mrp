import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DocNumberService } from '../common/doc-number.service.js';
import { CreateSupplierPaymentDto } from './dto/purchase.dto.js';

/**
 * 供应商付款控制器
 */
@ApiTags('采购-供应商付款')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchase/payments')
export class SupplierPaymentController {
  constructor(
    private prisma: PrismaService,
    private docNumberService: DocNumberService,
  ) {}

  /** 分页查询付款记录 */
  @Get()
  @ApiOperation({ summary: '查询供应商付款列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    const p = page ? parseInt(page) : 1;
    const ps = pageSize ? parseInt(pageSize) : 20;

    const where: any = {};
    if (supplierId) where.supplierId = supplierId;

    const [data, total] = await Promise.all([
      this.prisma.supplierPayment.findMany({
        where,
        skip: (p - 1) * ps,
        take: ps,
        orderBy: { createdAt: 'desc' },
        include: { supplier: { select: { code: true, companyName: true } } },
      }),
      this.prisma.supplierPayment.count({ where }),
    ]);

    return { data, total, page: p, pageSize: ps };
  }

  /** 查询付款详情 */
  @Get(':id')
  @ApiOperation({ summary: '查询付款详情' })
  async findOne(@Param('id') id: string) {
    return this.prisma.supplierPayment.findUnique({
      where: { id },
      include: { supplier: { select: { code: true, companyName: true } } },
    });
  }

  /** 创建供应商付款（同时减少供应商应付余额） */
  @Post()
  @ApiOperation({ summary: '创建供应商付款' })
  async create(@Body() dto: CreateSupplierPaymentDto) {
    const docNo = await this.docNumberService.generateDocNo('SP');

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.supplierPayment.create({
        data: {
          supplierId: dto.supplierId,
          docNo,
          date: new Date(dto.date),
          amount: dto.amount,
          currency: (dto.currency as any) || 'MYR',
          method: dto.method,
          refNo: dto.refNo,
          notes: dto.notes,
        },
        include: { supplier: { select: { code: true, companyName: true } } },
      });

      // 减少供应商应付余额
      await tx.supplier.update({
        where: { id: dto.supplierId },
        data: { outstandingAmount: { decrement: dto.amount } },
      });

      return payment;
    });
  }

  /** 更新供应商付款记录 */
  @Put(':id')
  @ApiOperation({ summary: '更新供应商付款记录' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateSupplierPaymentDto>) {
    const existing = await this.prisma.supplierPayment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('付款记录不存在');

    return this.prisma.$transaction(async (tx) => {
      // 如果金额变化，调整供应商应付余额
      if (dto.amount !== undefined && dto.amount !== Number(existing.amount)) {
        const diff = Number(existing.amount) - dto.amount;
        await tx.supplier.update({
          where: { id: existing.supplierId },
          data: { outstandingAmount: { increment: diff } },
        });
      }

      const updateData: any = { ...dto };
      if (updateData.date) updateData.date = new Date(updateData.date);
      if (updateData.currency) updateData.currency = updateData.currency as any;
      // supplierId 不允许修改
      delete updateData.supplierId;

      return tx.supplierPayment.update({
        where: { id },
        data: updateData,
        include: { supplier: { select: { code: true, companyName: true } } },
      });
    });
  }

  /** 删除付款记录 */
  @Delete(':id')
  @ApiOperation({ summary: '删除付款记录' })
  async remove(@Param('id') id: string) {
    const payment = await this.prisma.supplierPayment.findUnique({ where: { id } });
    if (!payment) return;

    return this.prisma.$transaction(async (tx) => {
      await tx.supplierPayment.delete({ where: { id } });
      await tx.supplier.update({
        where: { id: payment.supplierId },
        data: { outstandingAmount: { increment: payment.amount } },
      });
      return { success: true };
    });
  }
}
