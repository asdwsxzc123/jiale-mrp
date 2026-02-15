import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * 溯源服务 - 根据溯源码查询原材料批次或成品的完整追溯链
 */
@Injectable()
export class TraceService {
  constructor(private prisma: PrismaService) {}

  /** 分页查询原材料批次列表 */
  async findAllBatches(query: {
    page?: number;
    pageSize?: number;
    status?: string;
    supplierId?: string;
    itemId?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.supplierId) where.supplierId = query.supplierId;
    if (query.itemId) where.itemId = query.itemId;

    const [data, total] = await Promise.all([
      this.prisma.rawMaterialBatch.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          item: { select: { id: true, code: true, description: true } },
          supplier: { select: { id: true, code: true, companyName: true } },
          warehouseLocation: { select: { id: true, name: true } },
        },
      }),
      this.prisma.rawMaterialBatch.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  /** 查询原材料批次详情 */
  async findOneBatch(id: string) {
    const batch = await this.prisma.rawMaterialBatch.findUnique({
      where: { id },
      include: {
        item: { select: { id: true, code: true, description: true } },
        supplier: { select: { id: true, code: true, companyName: true } },
        purchaseDoc: { select: { id: true, docNo: true, type: true, date: true } },
        inspection: {
          select: {
            id: true,
            status: true,
            inspectionDate: true,
            wrongItem: true,
            weightDifference: true,
          },
        },
        warehouseLocation: { select: { id: true, name: true } },
      },
    });

    if (!batch) throw new NotFoundException(`原材料批次不存在`);
    return batch;
  }

  /**
   * 查询原材料批次溯源信息
   * 包含：批次信息、关联物料、供应商、采购单据、检验记录
   */
  async traceRawMaterial(code: string) {
    const batch = await this.prisma.rawMaterialBatch.findUnique({
      where: { traceabilityCode: code },
      include: {
        item: { select: { code: true, description: true, baseUom: true } },
        supplier: { select: { code: true, companyName: true } },
        purchaseDoc: { select: { docNo: true, type: true, date: true } },
        inspection: {
          select: {
            id: true,
            status: true,
            inspectionDate: true,
            wrongItem: true,
            weightDifference: true,
            handlingMethod: true,
          },
        },
        warehouseLocation: { select: { name: true } },
      },
    });

    if (!batch) throw new NotFoundException(`原材料批次 ${code} 不存在`);

    return {
      type: 'RAW_MATERIAL',
      traceabilityCode: batch.traceabilityCode,
      batch,
    };
  }

  /**
   * 查询成品溯源信息
   * 包含：成品信息、工单、使用的原材料批次（向上追溯）
   */
  async traceFinishedProduct(code: string) {
    const product = await this.prisma.finishedProduct.findUnique({
      where: { traceabilityCode: code },
      include: {
        item: { select: { code: true, description: true, baseUom: true } },
        jobOrder: {
          select: {
            docNo: true,
            plannedQty: true,
            completedQty: true,
            color: true,
            plannedStart: true,
            actualEnd: true,
            materials: {
              select: {
                materialItemId: true,
                requiredQty: true,
                issuedQty: true,
                uom: true,
                rawMaterialBatchId: true,
              },
            },
          },
        },
        warehouseLocation: { select: { name: true } },
        materials: {
          include: {
            finishedProduct: false,
          },
        },
      },
    });

    if (!product) throw new NotFoundException(`成品 ${code} 不存在`);

    // 查询使用的原材料批次详情
    const materialBatchIds = product.materials.map((m) => m.rawMaterialBatchId);
    const materialBatches = await this.prisma.rawMaterialBatch.findMany({
      where: { id: { in: materialBatchIds } },
      include: {
        item: { select: { code: true, description: true } },
        supplier: { select: { code: true, companyName: true } },
      },
    });

    return {
      type: 'FINISHED_PRODUCT',
      traceabilityCode: product.traceabilityCode,
      product,
      materialBatches,
    };
  }

  /**
   * 自动识别溯源码前缀并查询
   * RM- 开头 -> 原材料批次
   * FP- 开头 -> 成品
   */
  async scan(code: string) {
    if (code.startsWith('RM-')) {
      return this.traceRawMaterial(code);
    } else if (code.startsWith('FP-')) {
      return this.traceFinishedProduct(code);
    } else {
      throw new BadRequestException(`无法识别溯源码格式: ${code}，需要 RM- 或 FP- 前缀`);
    }
  }
}
