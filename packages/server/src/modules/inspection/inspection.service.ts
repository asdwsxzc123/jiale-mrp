import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateInspectionDto, PassInspectionDto } from './dto/inspection.dto.js';

/**
 * 来料检验服务 - 处理检验记录的 CRUD、合格/不合格判定
 */
@Injectable()
export class InspectionService {
  constructor(private prisma: PrismaService) {}

  /** 分页查询检验记录 */
  async findAll(query: {
    page?: number;
    pageSize?: number;
    status?: string;
    supplierId?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.supplierId) where.supplierId = query.supplierId;

    const [data, total] = await Promise.all([
      this.prisma.incomingInspection.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { code: true, companyName: true } },
        },
      }),
      this.prisma.incomingInspection.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  /** 查询检验详情 */
  async findOne(id: string) {
    const inspection = await this.prisma.incomingInspection.findUnique({
      where: { id },
      include: {
        supplier: { select: { code: true, companyName: true } },
        rawMaterialBatches: true,
      },
    });
    if (!inspection) throw new NotFoundException('检验记录不存在');
    return inspection;
  }

  /** 创建检验记录 */
  async create(dto: CreateInspectionDto) {
    return this.prisma.incomingInspection.create({
      data: {
        purchaseDocId: dto.purchaseDocId,
        purchaseDocItemId: dto.purchaseDocItemId,
        itemId: dto.itemId,
        supplierId: dto.supplierId,
        inspectionDate: new Date(dto.inspectionDate),
        wrongItem: dto.wrongItem || false,
        wrongItemDescription: dto.wrongItemDescription,
        weightDifference: dto.weightDifference,
        handlingMethod: dto.handlingMethod as any,
        handlingNotes: dto.handlingNotes,
        inspectorId: dto.inspectorId,
      },
    });
  }

  /** 更新检验记录（仅 PENDING 状态可编辑） */
  async update(id: string, dto: Partial<CreateInspectionDto>) {
    const inspection = await this.findOne(id);
    if (inspection.status !== 'PENDING') {
      throw new BadRequestException('只有待检状态的记录可以编辑');
    }

    const updateData: any = { ...dto };
    // 日期字段转换
    if (updateData.inspectionDate) {
      updateData.inspectionDate = new Date(updateData.inspectionDate);
    }
    if (updateData.handlingMethod) {
      updateData.handlingMethod = updateData.handlingMethod as any;
    }

    return this.prisma.incomingInspection.update({
      where: { id },
      data: updateData,
      include: {
        supplier: { select: { code: true, companyName: true } },
      },
    });
  }

  /**
   * 检验合格 - 生成 RawMaterialBatch + 溯源码 RM-YYYYMMDD-XXX
   */
  async pass(id: string, dto: PassInspectionDto) {
    const inspection = await this.findOne(id);
    if (inspection.status !== 'PENDING') {
      throw new BadRequestException('只有待检状态的记录可以判定合格');
    }

    return this.prisma.$transaction(async (tx) => {
      // 更新检验状态
      await tx.incomingInspection.update({
        where: { id },
        data: { status: 'PASSED' },
      });

      // 生成溯源码 RM-YYYYMMDD-XXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const count = await tx.rawMaterialBatch.count({
        where: {
          traceabilityCode: { startsWith: `RM-${dateStr}` },
        },
      });
      const traceabilityCode = `RM-${dateStr}-${String(count + 1).padStart(3, '0')}`;

      // 创建原材料批次
      const batch = await tx.rawMaterialBatch.create({
        data: {
          traceabilityCode,
          itemId: inspection.itemId,
          purchaseDocId: inspection.purchaseDocId,
          purchaseDocItemId: inspection.purchaseDocItemId,
          inspectionId: inspection.id,
          supplierId: inspection.supplierId,
          weight: dto.weight,
          weightUnit: dto.weightUnit || 'KG',
          warehouseLocationId: dto.warehouseLocationId,
          receivedDate: today,
          remainingWeight: dto.weight,
        },
      });

      return { inspection: { id, status: 'PASSED' }, batch };
    });
  }

  /** 检验不合格 */
  async reject(id: string) {
    const inspection = await this.findOne(id);
    if (inspection.status !== 'PENDING') {
      throw new BadRequestException('只有待检状态的记录可以判定不合格');
    }

    return this.prisma.incomingInspection.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }
}
