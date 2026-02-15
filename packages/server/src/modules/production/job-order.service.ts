import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { DocNumberService } from '../common/doc-number.service.js';
import { CreateJobOrderDto, IssueMaterialDto, OutputDto, CompleteDto } from './dto/production.dto.js';

/**
 * 工单服务 - 处理生产工单的 CRUD、领料、产出、完工
 */
@Injectable()
export class JobOrderService {
  constructor(
    private prisma: PrismaService,
    private docNumberService: DocNumberService,
  ) {}

  /** 分页查询工单列表 */
  async findAll(query: { page?: number; pageSize?: number; status?: string }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.jobOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { materials: true },
      }),
      this.prisma.jobOrder.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  /** 查询工单详情 */
  async findOne(id: string) {
    const order = await this.prisma.jobOrder.findUnique({
      where: { id },
      include: { materials: true, bom: { include: { items: true } }, finishedProducts: true },
    });
    if (!order) throw new NotFoundException('工单不存在');
    return order;
  }

  /** 创建工单 */
  async create(dto: CreateJobOrderDto, userId?: string) {
    const docNo = await this.docNumberService.generateDocNo('JO');

    return this.prisma.jobOrder.create({
      data: {
        docNo,
        productItemId: dto.productItemId,
        bomId: dto.bomId,
        plannedQty: dto.plannedQty,
        color: dto.color,
        plannedWeight: dto.plannedWeight,
        productionCycle: dto.productionCycle,
        plannedStart: dto.plannedStart ? new Date(dto.plannedStart) : undefined,
        plannedEnd: dto.plannedEnd ? new Date(dto.plannedEnd) : undefined,
        createdBy: userId,
        materials: dto.materials
          ? {
              create: dto.materials.map((m) => ({
                materialItemId: m.materialItemId,
                requiredQty: m.requiredQty,
                uom: m.uom,
                rawMaterialBatchId: m.rawMaterialBatchId,
              })),
            }
          : undefined,
      },
      include: { materials: true },
    });
  }

  /** 更新工单 */
  async update(id: string, dto: Partial<CreateJobOrderDto>) {
    const order = await this.findOne(id);
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new BadRequestException('已完工或已取消的工单不可编辑');
    }

    const updateData: any = { ...dto };
    delete updateData.materials;
    if (updateData.plannedStart) updateData.plannedStart = new Date(updateData.plannedStart);
    if (updateData.plannedEnd) updateData.plannedEnd = new Date(updateData.plannedEnd);

    return this.prisma.jobOrder.update({
      where: { id },
      data: updateData,
      include: { materials: true },
    });
  }

  /** 删除工单（仅 PLANNED 状态可删除） */
  async remove(id: string) {
    const order = await this.findOne(id);
    if (order.status !== 'PLANNED') {
      throw new BadRequestException('只有计划状态的工单可以删除');
    }

    // 先删除物料明细，再删除工单
    await this.prisma.jobOrderMaterial.deleteMany({ where: { jobOrderId: id } });
    await this.prisma.jobOrder.delete({ where: { id } });
    return { success: true };
  }

  /**
   * 领料 - 更新工单物料的已领数量，并扣减原材料批次余量
   */
  async issueMaterial(id: string, dto: IssueMaterialDto) {
    const order = await this.findOne(id);
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new BadRequestException('已完工或已取消的工单不可领料');
    }

    // 更新工单状态为进行中
    if (order.status === 'PLANNED') {
      await this.prisma.jobOrder.update({
        where: { id },
        data: { status: 'IN_PROGRESS', actualStart: new Date() },
      });
    }

    // 增加已领数量
    await this.prisma.jobOrderMaterial.update({
      where: { id: dto.materialId },
      data: {
        issuedQty: { increment: dto.qty },
        rawMaterialBatchId: dto.rawMaterialBatchId,
      },
    });

    // 如果指定了批次，扣减批次余量
    if (dto.rawMaterialBatchId) {
      await this.prisma.rawMaterialBatch.update({
        where: { id: dto.rawMaterialBatchId },
        data: {
          remainingWeight: { decrement: dto.qty },
        },
      });
    }

    return this.findOne(id);
  }

  /** 产出登记 - 记录产出数量和实际重量 */
  async output(id: string, dto: OutputDto) {
    const order = await this.findOne(id);
    if (order.status !== 'IN_PROGRESS') {
      throw new BadRequestException('只有进行中的工单可以登记产出');
    }

    return this.prisma.jobOrder.update({
      where: { id },
      data: {
        completedQty: { increment: dto.qty },
        actualWeight: dto.actualWeight,
      },
    });
  }

  /**
   * 完工 - 创建 FinishedProduct + 溯源码 FP-YYYYMMDD-XXX
   */
  async complete(id: string, dto: CompleteDto) {
    const order = await this.findOne(id);
    if (order.status !== 'IN_PROGRESS') {
      throw new BadRequestException('只有进行中的工单可以完工');
    }

    return this.prisma.$transaction(async (tx) => {
      // 更新工单状态
      await tx.jobOrder.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          actualEnd: new Date(),
          actualWeight: dto.weight,
          yieldRate: order.plannedWeight
            ? (dto.weight / Number(order.plannedWeight)) * 100
            : undefined,
        },
      });

      // 生成溯源码 FP-YYYYMMDD-XXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const count = await tx.finishedProduct.count({
        where: { traceabilityCode: { startsWith: `FP-${dateStr}` } },
      });
      const traceabilityCode = `FP-${dateStr}-${String(count + 1).padStart(3, '0')}`;

      // 创建成品记录
      const finishedProduct = await tx.finishedProduct.create({
        data: {
          traceabilityCode,
          itemId: order.productItemId,
          jobOrderId: order.id,
          productionDate: today,
          color: order.color,
          weight: dto.weight,
          weightUnit: dto.weightUnit || 'KG',
          warehouseLocationId: dto.warehouseLocationId,
          qrCodeData: {
            traceabilityCode,
            productItemId: order.productItemId,
            jobOrderDocNo: order.docNo,
            productionDate: today.toISOString(),
            weight: dto.weight,
            color: order.color,
          },
          // 记录使用的原材料批次（用于溯源）
          materials: dto.usedMaterials
            ? {
                create: dto.usedMaterials.map((m) => ({
                  rawMaterialBatchId: m.rawMaterialBatchId,
                  usedWeight: m.usedWeight,
                })),
              }
            : undefined,
        },
      });

      return { jobOrder: { id, status: 'COMPLETED' }, finishedProduct };
    });
  }
}
