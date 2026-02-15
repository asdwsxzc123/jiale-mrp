import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { DocNumberService } from '../common/doc-number.service.js';
import { CreatePurchaseDocumentDto } from './dto/purchase.dto.js';

/** 采购单据类型 -> 编号前缀 */
const TYPE_PREFIX_MAP: Record<string, string> = {
  REQUEST: 'PR',
  ORDER: 'PO',
  GOODS_RECEIVED: 'GR',
  INVOICE: 'PI',
  CASH_PURCHASE: 'CP',
  RETURNED: 'RT',
};

/**
 * 采购单据服务 - 处理采购请求、订单、收货、发票等
 */
@Injectable()
export class PurchaseDocumentService {
  constructor(
    private prisma: PrismaService,
    private docNumberService: DocNumberService,
  ) {}

  /** 分页查询采购单据 */
  async findAll(query: {
    page?: number;
    pageSize?: number;
    type?: string;
    status?: string;
    supplierId?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.supplierId) where.supplierId = query.supplierId;

    const [data, total] = await Promise.all([
      this.prisma.purchaseDocument.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { code: true, companyName: true } },
          items: true,
        },
      }),
      this.prisma.purchaseDocument.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  /** 查询单据详情 */
  async findOne(id: string) {
    const doc = await this.prisma.purchaseDocument.findUnique({
      where: { id },
      include: {
        supplier: { select: { code: true, companyName: true } },
        items: true,
      },
    });
    if (!doc) throw new NotFoundException('采购单据不存在');
    return doc;
  }

  /** 创建采购单据 */
  async create(dto: CreatePurchaseDocumentDto, userId?: string) {
    const prefix = TYPE_PREFIX_MAP[dto.type] || 'PD';
    const docNo = await this.docNumberService.generateDocNo(prefix);

    // 计算明细行金额
    const items = dto.items.map((item) => {
      const subtotal = item.qty * item.unitPrice - (item.discount || 0);
      const taxAmount = subtotal * ((item.taxRate || 0) / 100);
      const total = subtotal + taxAmount;
      return {
        ...item,
        subtotal,
        taxAmount,
        total,
        plannedArrivalDate: item.plannedArrivalDate ? new Date(item.plannedArrivalDate) : undefined,
        actualArrivalDate: item.actualArrivalDate ? new Date(item.actualArrivalDate) : undefined,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const taxAmount = items.reduce((sum, i) => sum + i.taxAmount, 0);
    const total = subtotal + taxAmount;

    return this.prisma.purchaseDocument.create({
      data: {
        type: dto.type as any,
        docNo,
        supplierId: dto.supplierId,
        branchId: dto.branchId,
        date: new Date(dto.date),
        agent: dto.agent,
        terms: dto.terms,
        description: dto.description,
        project: dto.project,
        refNo: dto.refNo,
        extNo: dto.extNo,
        currency: (dto.currency as any) || 'MYR',
        exchangeRate: dto.exchangeRate || 1,
        subtotal,
        taxAmount,
        total,
        outstanding: total,
        refDocId: dto.refDocId,
        createdBy: userId,
        items: { create: items as any },
      },
      include: { items: true },
    });
  }

  /** 更新采购单据 */
  async update(id: string, dto: Partial<CreatePurchaseDocumentDto>) {
    const doc = await this.findOne(id);
    if (doc.status !== 'DRAFT') {
      throw new BadRequestException('只有草稿状态的单据可以编辑');
    }

    const updateData: any = { ...dto };
    delete updateData.items;
    delete updateData.type;
    if (updateData.date) updateData.date = new Date(updateData.date);
    if (updateData.currency) updateData.currency = updateData.currency as any;

    if (dto.items) {
      await this.prisma.purchaseDocumentItem.deleteMany({ where: { documentId: id } });
      const items = dto.items.map((item) => {
        const subtotal = item.qty * item.unitPrice - (item.discount || 0);
        const taxAmount = subtotal * ((item.taxRate || 0) / 100);
        const total = subtotal + taxAmount;
        return {
          ...item, subtotal, taxAmount, total, documentId: id,
          plannedArrivalDate: item.plannedArrivalDate ? new Date(item.plannedArrivalDate) : undefined,
          actualArrivalDate: item.actualArrivalDate ? new Date(item.actualArrivalDate) : undefined,
        };
      });

      updateData.subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
      updateData.taxAmount = items.reduce((sum, i) => sum + i.taxAmount, 0);
      updateData.total = updateData.subtotal + updateData.taxAmount;
      updateData.outstanding = updateData.total;

      await this.prisma.purchaseDocumentItem.createMany({ data: items as any });
    }

    return this.prisma.purchaseDocument.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });
  }

  /** 审批单据 */
  async approve(id: string) {
    const doc = await this.findOne(id);
    if (doc.status !== 'DRAFT') {
      throw new BadRequestException('只有草稿状态的单据可以审批');
    }

    return this.prisma.purchaseDocument.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  /** 取消单据 */
  async cancel(id: string) {
    const doc = await this.findOne(id);
    if (doc.status === 'CANCELLED') {
      throw new BadRequestException('单据已取消');
    }

    return this.prisma.purchaseDocument.update({
      where: { id },
      data: { status: 'CANCELLED', isCancelled: true, isTransferable: false },
    });
  }

  /** 删除采购单据（仅 DRAFT 状态） */
  async remove(id: string) {
    const doc = await this.findOne(id);
    if (doc.status !== 'DRAFT') {
      throw new BadRequestException('只有草稿状态的单据可以删除');
    }

    // 先删除明细行，再删除主单据
    await this.prisma.purchaseDocumentItem.deleteMany({ where: { documentId: id } });
    await this.prisma.purchaseDocument.delete({ where: { id } });
    return { success: true };
  }

  /**
   * 单据转换
   * 收货时自动创建来料检验记录
   */
  async transfer(id: string, targetType: string, userId?: string) {
    const source = await this.findOne(id);
    if (!source.isTransferable) {
      throw new BadRequestException('该单据不可转换');
    }
    if (source.status !== 'APPROVED') {
      throw new BadRequestException('只有已审批的单据可以转换');
    }

    const newDto: CreatePurchaseDocumentDto = {
      type: targetType,
      supplierId: source.supplierId,
      branchId: source.branchId || undefined,
      date: new Date().toISOString().split('T')[0],
      agent: source.agent || undefined,
      terms: source.terms || undefined,
      description: source.description || undefined,
      currency: source.currency as any,
      exchangeRate: Number(source.exchangeRate),
      refDocId: source.id,
      items: source.items.map((item) => ({
        itemId: item.itemId || undefined,
        description: item.description || undefined,
        qty: Number(item.qty),
        uom: item.uom || undefined,
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        taxCode: item.taxCode || undefined,
        taxRate: Number(item.taxRate),
        taxInclusive: item.taxInclusive,
        plannedWeight: item.plannedWeight ? Number(item.plannedWeight) : undefined,
        actualWeight: item.actualWeight ? Number(item.actualWeight) : undefined,
        weightUnit: item.weightUnit || undefined,
      })),
    };

    const newDoc = await this.create(newDto, userId);

    // 将源单据标记为已转换
    await this.prisma.salesDocument.update({
      where: { id },
      data: { status: 'TRANSFERRED', isTransferable: false },
    }).catch(() => {
      // 采购单据使用 purchaseDocument 表
      return this.prisma.purchaseDocument.update({
        where: { id },
        data: { status: 'TRANSFERRED', isTransferable: false },
      });
    });

    // 收货单创建时自动创建来料检验记录
    if (targetType === 'GOODS_RECEIVED') {
      for (const item of newDoc.items) {
        if (item.itemId) {
          await this.prisma.incomingInspection.create({
            data: {
              purchaseDocId: newDoc.id,
              purchaseDocItemId: item.id,
              itemId: item.itemId,
              supplierId: source.supplierId,
              inspectionDate: new Date(),
              weightDifference: item.actualWeight && item.plannedWeight
                ? Number(item.actualWeight) - Number(item.plannedWeight)
                : undefined,
            },
          });
        }
      }
    }

    // 采购发票创建时更新供应商应付余额
    if (targetType === 'INVOICE') {
      await this.prisma.supplier.update({
        where: { id: source.supplierId },
        data: { outstandingAmount: { increment: Number(newDoc.total) } },
      });
    }

    return newDoc;
  }
}
