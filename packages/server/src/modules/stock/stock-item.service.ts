import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStockItemDto } from './dto/stock.dto.js';

/**
 * 库存物料服务 - 物料主数据的 CRUD
 */
@Injectable()
export class StockItemService {
  constructor(private prisma: PrismaService) {}

  /** 分页查询物料列表 */
  async findAll(query: {
    page?: number;
    pageSize?: number;
    search?: string;
    groupId?: string;
    categoryId?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.groupId) where.groupId = query.groupId;
    if (query.categoryId) where.categoryId = query.categoryId;

    const [data, total] = await Promise.all([
      this.prisma.stockItem.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { group: true, category: true, uoms: true },
      }),
      this.prisma.stockItem.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  /** 查询物料详情 */
  async findOne(id: string) {
    const item = await this.prisma.stockItem.findUnique({
      where: { id },
      include: { group: true, category: true, uoms: true, balances: { include: { location: true } } },
    });
    if (!item) throw new NotFoundException('物料不存在');
    return item;
  }

  /** 创建物料 */
  async create(dto: CreateStockItemDto) {
    return this.prisma.stockItem.create({
      data: dto as any,
      include: { group: true, category: true },
    });
  }

  /** 更新物料 */
  async update(id: string, dto: Partial<CreateStockItemDto>) {
    await this.findOne(id);
    return this.prisma.stockItem.update({
      where: { id },
      data: dto as any,
      include: { group: true, category: true },
    });
  }

  /** 软删除物料 */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.stockItem.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
