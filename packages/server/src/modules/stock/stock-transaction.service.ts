import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { DocNumberService } from '../common/doc-number.service.js';
import { StockBalanceService } from './stock-balance.service.js';
import { CreateStockTransactionDto } from './dto/stock.dto.js';

/**
 * 库存事务服务 - 处理入库/出库/调整/调拨等库存变动
 */
@Injectable()
export class StockTransactionService {
  constructor(
    private prisma: PrismaService,
    private docNumberService: DocNumberService,
    private stockBalanceService: StockBalanceService,
  ) {}

  /** 分页查询库存事务 */
  async findAll(query: {
    page?: number;
    pageSize?: number;
    type?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.type) where.type = query.type;

    const [data, total] = await Promise.all([
      this.prisma.stockTransaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.stockTransaction.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  /**
   * 创建库存事务（使用事务保证原子性）
   * 入库：增加目标仓位余额
   * 出库：减少来源仓位余额
   * 调拨：减少来源仓位 + 增加目标仓位
   * 调整：根据数量正负调整目标仓位
   */
  async create(dto: CreateStockTransactionDto, userId?: string) {
    const docNo = await this.docNumberService.generateDocNo('ST');

    return this.prisma.$transaction(async (tx) => {
      // 创建事务主记录
      const transaction = await tx.stockTransaction.create({
        data: {
          type: dto.type as any,
          docNo,
          date: new Date(dto.date),
          locationFromId: dto.locationFromId,
          locationToId: dto.locationToId,
          refDocumentType: dto.refDocumentType,
          refDocumentId: dto.refDocumentId,
          createdBy: userId,
          items: {
            create: dto.items.map((item) => ({
              itemId: item.itemId,
              qty: item.qty,
              uom: item.uom,
              unitCost: item.unitCost || 0,
              notes: item.notes,
            })),
          },
        },
        include: { items: true },
      });

      // 根据事务类型更新库存余额
      for (const item of dto.items) {
        switch (dto.type) {
          case 'RECEIVED':
            // 入库：增加目标仓位
            if (!dto.locationToId) throw new BadRequestException('入库需要指定目标仓位');
            await this.stockBalanceService.adjustBalance(item.itemId, dto.locationToId, item.qty, tx);
            break;

          case 'ISSUE':
            // 出库：减少来源仓位
            if (!dto.locationFromId) throw new BadRequestException('出库需要指定来源仓位');
            await this.stockBalanceService.adjustBalance(item.itemId, dto.locationFromId, -item.qty, tx);
            break;

          case 'TRANSFER':
            // 调拨：两个仓位同时变动
            if (!dto.locationFromId || !dto.locationToId) {
              throw new BadRequestException('调拨需要同时指定来源和目标仓位');
            }
            await this.stockBalanceService.adjustBalance(item.itemId, dto.locationFromId, -item.qty, tx);
            await this.stockBalanceService.adjustBalance(item.itemId, dto.locationToId, item.qty, tx);
            break;

          case 'ADJUSTMENT':
            // 调整：可正可负
            if (!dto.locationToId) throw new BadRequestException('调整需要指定仓位');
            await this.stockBalanceService.adjustBalance(item.itemId, dto.locationToId, item.qty, tx);
            break;
        }
      }

      return transaction;
    });
  }
}
