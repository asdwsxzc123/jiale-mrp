import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCustomerDto, CreateCustomerBranchDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

/**
 * 客户服务 - 处理客户及分支的 CRUD 操作
 */
@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  /**
   * 生成客户编码 300-XXXX
   * 查询当前最大编码后递增
   */
  private async generateCode(): Promise<string> {
    const last = await this.prisma.customer.findFirst({
      where: { code: { startsWith: '300-' } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    const nextNum = last ? parseInt(last.code.split('-')[1]) + 1 : 1;
    return `300-${String(nextNum).padStart(4, '0')}`;
  }

  /** 分页查询客户列表（支持搜索和筛选） */
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

    // 构建筛选条件
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
      this.prisma.customer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { branches: true },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  /** 根据 ID 查询客户详情（含分支） */
  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { branches: true },
    });
    if (!customer) throw new NotFoundException('客户不存在');
    return customer;
  }

  /** 创建客户（自动生成编码） */
  async create(dto: CreateCustomerDto) {
    const code = await this.generateCode();
    const { branches, ...data } = dto;

    return this.prisma.customer.create({
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

  /** 更新客户信息 */
  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id); // 确保存在
    const { branches, ...data } = dto;

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...data,
        currency: data.currency as any,
      },
      include: { branches: true },
    });
  }

  /** 软删除客户（标记为不活跃） */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /** 创建客户分支 */
  async createBranch(customerId: string, dto: CreateCustomerBranchDto) {
    await this.findOne(customerId);
    return this.prisma.customerBranch.create({
      data: { ...dto, customerId },
    });
  }

  /** 更新客户分支 */
  async updateBranch(customerId: string, branchId: string, dto: CreateCustomerBranchDto) {
    await this.findOne(customerId);
    return this.prisma.customerBranch.update({
      where: { id: branchId },
      data: dto,
    });
  }

  /** 删除客户分支 */
  async removeBranch(customerId: string, branchId: string) {
    await this.findOne(customerId);
    return this.prisma.customerBranch.delete({
      where: { id: branchId },
    });
  }
}
