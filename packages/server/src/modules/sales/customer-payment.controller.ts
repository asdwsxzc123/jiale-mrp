import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DocNumberService } from '../common/doc-number.service.js';
import { CreateCustomerPaymentDto } from './dto/sales.dto.js';

/**
 * 客户收款控制器 - 处理客户付款记录
 */
@ApiTags('销售-客户收款')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales/payments')
export class CustomerPaymentController {
  constructor(
    private prisma: PrismaService,
    private docNumberService: DocNumberService,
  ) {}

  /** 分页查询收款记录 */
  @Get()
  @ApiOperation({ summary: '查询客户收款列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('customerId') customerId?: string,
  ) {
    const p = page ? parseInt(page) : 1;
    const ps = pageSize ? parseInt(pageSize) : 20;

    const where: any = {};
    if (customerId) where.customerId = customerId;

    const [data, total] = await Promise.all([
      this.prisma.customerPayment.findMany({
        where,
        skip: (p - 1) * ps,
        take: ps,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { code: true, companyName: true } } },
      }),
      this.prisma.customerPayment.count({ where }),
    ]);

    return { data, total, page: p, pageSize: ps };
  }

  /** 查询收款详情 */
  @Get(':id')
  @ApiOperation({ summary: '查询收款详情' })
  async findOne(@Param('id') id: string) {
    return this.prisma.customerPayment.findUnique({
      where: { id },
      include: { customer: { select: { code: true, companyName: true } } },
    });
  }

  /** 创建客户收款（同时减少客户应收余额） */
  @Post()
  @ApiOperation({ summary: '创建客户收款' })
  async create(@Body() dto: CreateCustomerPaymentDto) {
    const docNo = await this.docNumberService.generateDocNo('CP');

    return this.prisma.$transaction(async (tx) => {
      // 创建收款记录
      const payment = await tx.customerPayment.create({
        data: {
          customerId: dto.customerId,
          docNo,
          date: new Date(dto.date),
          amount: dto.amount,
          currency: (dto.currency as any) || 'MYR',
          method: dto.method,
          refNo: dto.refNo,
          notes: dto.notes,
        },
        include: { customer: { select: { code: true, companyName: true } } },
      });

      // 减少客户应收余额
      await tx.customer.update({
        where: { id: dto.customerId },
        data: { outstandingAmount: { decrement: dto.amount } },
      });

      return payment;
    });
  }

  /** 更新客户收款记录 */
  @Put(':id')
  @ApiOperation({ summary: '更新客户收款记录' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateCustomerPaymentDto>) {
    const existing = await this.prisma.customerPayment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('收款记录不存在');

    return this.prisma.$transaction(async (tx) => {
      // 如果金额变化，调整客户应收余额
      if (dto.amount !== undefined && dto.amount !== Number(existing.amount)) {
        const diff = Number(existing.amount) - dto.amount;
        await tx.customer.update({
          where: { id: existing.customerId },
          data: { outstandingAmount: { increment: diff } },
        });
      }

      const updateData: any = { ...dto };
      if (updateData.date) updateData.date = new Date(updateData.date);
      if (updateData.currency) updateData.currency = updateData.currency as any;
      // customerId 不允许修改
      delete updateData.customerId;

      return tx.customerPayment.update({
        where: { id },
        data: updateData,
        include: { customer: { select: { code: true, companyName: true } } },
      });
    });
  }

  /** 删除收款记录（恢复客户应收余额） */
  @Delete(':id')
  @ApiOperation({ summary: '删除收款记录' })
  async remove(@Param('id') id: string) {
    const payment = await this.prisma.customerPayment.findUnique({ where: { id } });
    if (!payment) return;

    return this.prisma.$transaction(async (tx) => {
      await tx.customerPayment.delete({ where: { id } });
      await tx.customer.update({
        where: { id: payment.customerId },
        data: { outstandingAmount: { increment: payment.amount } },
      });
      return { success: true };
    });
  }
}
