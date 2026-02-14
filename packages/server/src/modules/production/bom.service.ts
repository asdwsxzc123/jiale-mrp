import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBOMDto } from './dto/production.dto.js';

/**
 * BOM 物料清单服务 - BOM 的 CRUD 和递归展开
 */
@Injectable()
export class BOMService {
  constructor(private prisma: PrismaService) {}

  /** 分页查询 BOM 列表 */
  async findAll(query: { page?: number; pageSize?: number; productItemId?: string }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.productItemId) where.productItemId = query.productItemId;

    const [data, total] = await Promise.all([
      this.prisma.bOM.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.bOM.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  /** 查询 BOM 详情 */
  async findOne(id: string) {
    const bom = await this.prisma.bOM.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!bom) throw new NotFoundException('BOM 不存在');
    return bom;
  }

  /** 创建 BOM */
  async create(dto: CreateBOMDto) {
    return this.prisma.bOM.create({
      data: {
        productItemId: dto.productItemId,
        version: dto.version || 'V1.0',
        description: dto.description,
        items: {
          create: dto.items.map((item) => ({
            materialItemId: item.materialItemId,
            quantity: item.quantity,
            uom: item.uom,
            isSubAssembly: item.isSubAssembly || false,
          })),
        },
      },
      include: { items: true },
    });
  }

  /** 更新 BOM */
  async update(id: string, dto: Partial<CreateBOMDto>) {
    await this.findOne(id);

    const updateData: any = {};
    if (dto.version) updateData.version = dto.version;
    if (dto.description !== undefined) updateData.description = dto.description;

    // 如果传了新的明细，先删后建
    if (dto.items) {
      await this.prisma.bOMItem.deleteMany({ where: { bomId: id } });
      updateData.items = {
        create: dto.items.map((item) => ({
          materialItemId: item.materialItemId,
          quantity: item.quantity,
          uom: item.uom,
          isSubAssembly: item.isSubAssembly || false,
        })),
      };
    }

    return this.prisma.bOM.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });
  }

  /** 删除 BOM */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.bOM.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * 递归展开 BOM
   * 如果某个 BOM 明细行标记为 isSubAssembly，则递归查找该物料的 BOM 并展开
   */
  async expand(id: string): Promise<any> {
    const bom = await this.findOne(id);

    const expandedItems: any[] = [];

    for (const item of bom.items) {
      if (item.isSubAssembly) {
        // 查找子装配件的 BOM
        const subBom = await this.prisma.bOM.findFirst({
          where: { productItemId: item.materialItemId, isActive: true },
          include: { items: true },
        });

        if (subBom) {
          // 递归展开子 BOM
          const subExpanded = await this.expand(subBom.id);
          expandedItems.push({
            ...item,
            subBom: subExpanded,
          });
        } else {
          expandedItems.push(item);
        }
      } else {
        expandedItems.push(item);
      }
    }

    return {
      ...bom,
      items: expandedItems,
    };
  }
}
