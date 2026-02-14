import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSupplierDto, CreateSupplierBranchDto } from './dto/create-supplier.dto.js';
import { UpdateSupplierDto } from './dto/update-supplier.dto.js';

/**
 * 供应商服务 - 处理供应商及分支的 CRUD 操作
 */
@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  /**
   * 生成供应商编码 400-XXXX
   */
  private async generateCode(): Promise<string> {
    const last = await this.prisma.supplier.findFirst({
      where: { code: { startsWith: '400-' } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    const nextNum = last ? parseInt(last.code.split('-')[1]) + 1 : 1;
    return `400-${String(nextNum).padStart(4, '0')}`;
  }

  /** 分页查询供应商列表 */
  async findAll(query: {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    isActive?: boolean;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.category) where.category = query.category;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { branches: true },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  /** 根据 ID 查询供应商详情 */
  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: { branches: true },
    });
    if (!supplier) throw new NotFoundException('供应商不存在');
    return supplier;
  }

  /** 创建供应商 */
  async create(dto: CreateSupplierDto) {
    const code = await this.generateCode();
    const { branches, ...data } = dto;

    return this.prisma.supplier.create({
      data: {
        ...data,
        code,
        currency: (data.currency as any) || 'MYR',
        branches: branches?.length
          ? { create: branches }
          : undefined,
      },
      include: { branches: true },
    });
  }

  /** 更新供应商 */
  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);
    const { branches, ...data } = dto;

    return this.prisma.supplier.update({
      where: { id },
      data: {
        ...data,
        currency: data.currency as any,
      },
      include: { branches: true },
    });
  }

  /** 软删除供应商 */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /** 创建供应商分支 */
  async createBranch(supplierId: string, dto: CreateSupplierBranchDto) {
    await this.findOne(supplierId);
    return this.prisma.supplierBranch.create({
      data: { ...dto, supplierId },
    });
  }

  /** 更新供应商分支 */
  async updateBranch(supplierId: string, branchId: string, dto: CreateSupplierBranchDto) {
    await this.findOne(supplierId);
    return this.prisma.supplierBranch.update({
      where: { id: branchId },
      data: dto,
    });
  }

  /** 删除供应商分支 */
  async removeBranch(supplierId: string, branchId: string) {
    await this.findOne(supplierId);
    return this.prisma.supplierBranch.delete({
      where: { id: branchId },
    });
  }
}
