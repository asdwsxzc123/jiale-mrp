import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { DocNumberService } from '../common/doc-number.service.js';
import { CreateSalesDocumentDto } from './dto/sales.dto.js';

/** 销售单据类型 -> 编号前缀映射 */
const TYPE_PREFIX_MAP: Record<string, string> = {
  QUOTATION: 'QT',
  SALES_ORDER: 'SO',
  DELIVERY_ORDER: 'DO',
  INVOICE: 'IV',
  CASH_SALE: 'CS',
};

/**
 * 销售单据服务 - 处理报价单、销售订单、出货单、发票等 CRUD 和业务逻辑
 */
@Injectable()
export class SalesDocumentService {
  constructor(
    private prisma: PrismaService,
    private docNumberService: DocNumberService,
  ) {}

  /** 分页查询销售单据 */
  async findAll(query: {
    page?: number;
    pageSize?: number;
    type?: string;
    status?: string;
    customerId?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;

    const [data, total] = await Promise.all([
      this.prisma.salesDocument.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { code: true, companyName: true } },
          items: true,
        },
      }),
      this.prisma.salesDocument.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  /** 查询单据详情 */
  async findOne(id: string) {
    const doc = await this.prisma.salesDocument.findUnique({
      where: { id },
      include: {
        customer: { select: { code: true, companyName: true } },
        items: true,
      },
    });
    if (!doc) throw new NotFoundException('销售单据不存在');
    return doc;
  }

  /** 创建销售单据 */
  async create(dto: CreateSalesDocumentDto, userId?: string) {
    const prefix = TYPE_PREFIX_MAP[dto.type] || 'SD';
    const docNo = await this.docNumberService.generateDocNo(prefix);

    // 计算明细金额
    const items = dto.items.map((item) => {
      const subtotal = item.qty * item.unitPrice - (item.discount || 0);
      const taxAmount = subtotal * ((item.taxRate || 0) / 100);
      const total = subtotal + taxAmount;
      return { ...item, subtotal, taxAmount, total };
    });

    // 计算汇总金额
    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const taxAmount = items.reduce((sum, i) => sum + i.taxAmount, 0);
    const total = subtotal + taxAmount;

    return this.prisma.salesDocument.create({
      data: {
        type: dto.type as any,
        docNo,
        customerId: dto.customerId,
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
        items: { create: items },
      },
      include: { items: true },
    });
  }

  /** 更新销售单据（仅 DRAFT 状态可编辑） */
  async update(id: string, dto: Partial<CreateSalesDocumentDto>) {
    const doc = await this.findOne(id);
    if (doc.status !== 'DRAFT') {
      throw new BadRequestException('只有草稿状态的单据可以编辑');
    }

    const updateData: any = { ...dto };
    delete updateData.items;
    delete updateData.type;
    if (updateData.date) updateData.date = new Date(updateData.date);
    if (updateData.currency) updateData.currency = updateData.currency as any;

    // 如果传了新的明细行，先删后建
    if (dto.items) {
      await this.prisma.salesDocumentItem.deleteMany({ where: { documentId: id } });

      const items = dto.items.map((item) => {
        const subtotal = item.qty * item.unitPrice - (item.discount || 0);
        const taxAmount = subtotal * ((item.taxRate || 0) / 100);
        const total = subtotal + taxAmount;
        return { ...item, subtotal, taxAmount, total, documentId: id };
      });

      const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
      const taxAmount = items.reduce((sum, i) => sum + i.taxAmount, 0);
      const total = subtotal + taxAmount;

      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.total = total;
      updateData.outstanding = total;

      await this.prisma.salesDocumentItem.createMany({ data: items });
    }

    return this.prisma.salesDocument.update({
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

    // 出货单审批时扣减库存（通过库存事务模块处理，此处仅更改状态）
    return this.prisma.salesDocument.update({
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

    return this.prisma.salesDocument.update({
      where: { id },
      data: { status: 'CANCELLED', isTransferable: false },
    });
  }

  /** 删除销售单据（仅 DRAFT 状态） */
  async remove(id: string) {
    const doc = await this.findOne(id);
    if (doc.status !== 'DRAFT') {
      throw new BadRequestException('只有草稿状态的单据可以删除');
    }

    // 先删除明细行，再删除主单据
    await this.prisma.salesDocumentItem.deleteMany({ where: { documentId: id } });
    await this.prisma.salesDocument.delete({ where: { id } });
    return { success: true };
  }

  /**
   * 单据转换（如报价单 -> 销售订单 -> 出货单 -> 发票）
   * 将源单据的明细复制到新类型单据
   */
  async transfer(id: string, targetType: string, userId?: string) {
    const source = await this.findOne(id);
    if (!source.isTransferable) {
      throw new BadRequestException('该单据不可转换');
    }
    if (source.status !== 'APPROVED') {
      throw new BadRequestException('只有已审批的单据可以转换');
    }

    // 创建新单据，复制源单据的明细
    const newDto: CreateSalesDocumentDto = {
      type: targetType,
      customerId: source.customerId,
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
      })),
    };

    const newDoc = await this.create(newDto, userId);

    // 将源单据标记为已转换
    await this.prisma.salesDocument.update({
      where: { id },
      data: { status: 'TRANSFERRED', isTransferable: false },
    });

    // 发票创建时更新客户应收余额
    if (targetType === 'INVOICE') {
      await this.prisma.customer.update({
        where: { id: source.customerId },
        data: { outstandingAmount: { increment: Number(newDoc.total) } },
      });
    }

    return newDoc;
  }
}
