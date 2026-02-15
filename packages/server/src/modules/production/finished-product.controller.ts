import {
  Controller, Get,
  Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * 成品管理控制器 - 查询由工单完工生成的成品记录
 */
@ApiTags('生产-成品')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('production/finished-products')
export class FinishedProductController {
  constructor(private prisma: PrismaService) {}

  /** 分页查询成品列表 */
  @Get()
  @ApiOperation({ summary: '查询成品列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'itemId', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('itemId') itemId?: string,
  ) {
    const p = page ? parseInt(page) : 1;
    const ps = pageSize ? parseInt(pageSize) : 20;

    const where: any = {};
    if (status) where.status = status;
    if (itemId) where.itemId = itemId;

    const [data, total] = await Promise.all([
      this.prisma.finishedProduct.findMany({
        where,
        skip: (p - 1) * ps,
        take: ps,
        orderBy: { createdAt: 'desc' },
        include: {
          item: { select: { id: true, code: true, description: true } },
          jobOrder: { select: { id: true, docNo: true } },
          warehouseLocation: { select: { id: true, name: true } },
        },
      }),
      this.prisma.finishedProduct.count({ where }),
    ]);

    return { data, total, page: p, pageSize: ps };
  }

  /** 查询成品详情（含溯源原材料） */
  @Get(':id')
  @ApiOperation({ summary: '查询成品详情' })
  async findOne(@Param('id') id: string) {
    return this.prisma.finishedProduct.findUnique({
      where: { id },
      include: {
        item: { select: { id: true, code: true, description: true } },
        jobOrder: { select: { id: true, docNo: true } },
        warehouseLocation: { select: { id: true, name: true } },
        materials: true,
      },
    });
  }
}
