import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateInboundDto } from './dto/create-inbound.dto.js';
import { CreateOutboundDto } from './dto/create-outbound.dto.js';
import { CreateYieldRateDto } from './dto/create-yield-rate.dto.js';

/**
 * 流水服务 - 入库流水/出库流水/出成率的 CRUD 操作
 */
@Injectable()
export class FlowService {
  constructor(private prisma: PrismaService) {}

  /**
   * 构建通用的 where 条件（时间区间 + 客户 + 材料）
   */
  private buildWhere(query: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    stockItemId?: string;
  }) {
    const where: any = {};
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }
    if (query.customerId) where.customerId = query.customerId;
    if (query.stockItemId) where.stockItemId = query.stockItemId;
    return where;
  }

  // ==================== 入库流水 ====================

  /** 查询入库流水列表（分页+筛选） */
  async findAllInbound(query: {
    page?: number; pageSize?: number;
    startDate?: string; endDate?: string;
    customerId?: string; stockItemId?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const where = this.buildWhere(query);
    const [data, total] = await Promise.all([
      this.prisma.inboundFlow.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: { date: 'desc' },
        include: { customer: true, stockItem: true },
      }),
      this.prisma.inboundFlow.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  /** 查询全部入库流水（导出用，不分页） */
  async findAllInboundForExport(query: {
    startDate?: string; endDate?: string;
    customerId?: string; stockItemId?: string;
  }) {
    return this.prisma.inboundFlow.findMany({
      where: this.buildWhere(query),
      orderBy: { date: 'asc' },
      include: { customer: true, stockItem: true },
    });
  }

  /** 创建入库流水 */
  async createInbound(dto: CreateInboundDto) {
    return this.prisma.inboundFlow.create({
      data: { ...dto, date: new Date(dto.date) },
      include: { customer: true, stockItem: true },
    });
  }

  /** 删除入库流水 */
  async removeInbound(id: string) {
    const record = await this.prisma.inboundFlow.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('入库流水记录不存在');
    return this.prisma.inboundFlow.delete({ where: { id } });
  }

  // ==================== 出库流水 ====================

  /** 查询出库流水列表（分页+筛选） */
  async findAllOutbound(query: {
    page?: number; pageSize?: number;
    startDate?: string; endDate?: string;
    customerId?: string; stockItemId?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const where = this.buildWhere(query);
    const [data, total] = await Promise.all([
      this.prisma.outboundFlow.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: { date: 'desc' },
        include: { customer: true, stockItem: true },
      }),
      this.prisma.outboundFlow.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  /** 查询全部出库流水（导出用，不分页） */
  async findAllOutboundForExport(query: {
    startDate?: string; endDate?: string;
    customerId?: string; stockItemId?: string;
  }) {
    return this.prisma.outboundFlow.findMany({
      where: this.buildWhere(query),
      orderBy: { date: 'asc' },
      include: { customer: true, stockItem: true },
    });
  }

  /** 创建出库流水 */
  async createOutbound(dto: CreateOutboundDto) {
    return this.prisma.outboundFlow.create({
      data: { ...dto, date: new Date(dto.date) },
      include: { customer: true, stockItem: true },
    });
  }

  /** 删除出库流水 */
  async removeOutbound(id: string) {
    const record = await this.prisma.outboundFlow.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('出库流水记录不存在');
    return this.prisma.outboundFlow.delete({ where: { id } });
  }

  // ==================== 出成率 ====================

  /** 查询出成率列表（分页+筛选） */
  async findAllYieldRate(query: {
    page?: number; pageSize?: number;
    startDate?: string; endDate?: string;
    customerId?: string; stockItemId?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const where = this.buildWhere(query);
    const [data, total] = await Promise.all([
      this.prisma.yieldRate.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: { date: 'desc' },
        include: { customer: true, stockItem: true },
      }),
      this.prisma.yieldRate.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  /** 查询全部出成率（导出用，不分页） */
  async findAllYieldRateForExport(query: {
    startDate?: string; endDate?: string;
    customerId?: string; stockItemId?: string;
  }) {
    return this.prisma.yieldRate.findMany({
      where: this.buildWhere(query),
      orderBy: { date: 'asc' },
      include: { customer: true, stockItem: true },
    });
  }

  /** 创建出成率记录 */
  async createYieldRate(dto: CreateYieldRateDto) {
    return this.prisma.yieldRate.create({
      data: { ...dto, date: new Date(dto.date) },
      include: { customer: true, stockItem: true },
    });
  }

  /** 删除出成率记录 */
  async removeYieldRate(id: string) {
    const record = await this.prisma.yieldRate.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('出成率记录不存在');
    return this.prisma.yieldRate.delete({ where: { id } });
  }
}
