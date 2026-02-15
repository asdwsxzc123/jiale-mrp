import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * 库存余额服务 - 查询各仓位物料余额
 */
@Injectable()
export class StockBalanceService {
  constructor(private prisma: PrismaService) {}

  /** 分页查询库存余额 */
  async findAll(query: {
    page?: number;
    pageSize?: number;
    itemId?: string;
    locationId?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.itemId) where.itemId = query.itemId;
    if (query.locationId) where.locationId = query.locationId;

    const [data, total] = await Promise.all([
      this.prisma.stockBalance.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          item: { select: { code: true, description: true, baseUom: true } },
          location: { select: { name: true } },
        },
      }),
      this.prisma.stockBalance.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  /**
   * 更新库存余额（内部方法，供库存事务调用）
   * @param itemId 物料 ID
   * @param locationId 仓位 ID
   * @param qtyChange 数量变化（正数入库，负数出库）
   * @param tx Prisma 事务客户端
   */
  async adjustBalance(itemId: string, locationId: string, qtyChange: number, tx: any) {
    // 使用 upsert 确保余额记录存在
    const existing = await tx.stockBalance.findUnique({
      where: { itemId_locationId: { itemId, locationId } },
    });

    if (existing) {
      await tx.stockBalance.update({
        where: { itemId_locationId: { itemId, locationId } },
        data: {
          quantity: { increment: qtyChange },
        },
      });
    } else {
      await tx.stockBalance.create({
        data: {
          itemId,
          locationId,
          quantity: qtyChange,
        },
      });
    }
  }
}
